import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import cloudinary from "../config/cloudinary";
import { createNotification } from "../utils/notificationService";
import { addPoints } from "../utils/rewardsService";

export const getPosts = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id,
        p.content,
        p.tag,
        p.likes_count AS likes,
        p.dislikes_count AS dislikes,
        p.trending,
        p.created_at AS time,
        p.author_id,
        u.name AS author,
        u.profile_picture,
        u.role AS author_role,
        (SELECT type FROM post_likes WHERE post_id = p.id AND user_id = $1) AS user_reaction,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'author', cu.name,
              'profile_picture', cu.profile_picture,
              'content', c.content,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL AND cu.id IS NOT NULL),
          '[]'
        ) AS comments,
        COALESCE(
          json_agg(pi.image_url) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS images
      FROM posts p
      JOIN users u ON u.id = p.author_id
        AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')
      LEFT JOIN comments c ON c.post_id = p.id
      LEFT JOIN users cu ON cu.id = c.author_id
        AND COALESCE(cu.status, 'active') NOT IN ('suspended', 'banned')
      LEFT JOIN post_images pi ON pi.post_id = p.id
      GROUP BY p.id, p.author_id, u.name, u.profile_picture, u.role, p.content, p.tag, p.likes_count, p.dislikes_count, p.trending, p.created_at
      ORDER BY p.created_at DESC
    `,
      [_req.user?.id || null]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getPosts error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        p.id,
        p.content,
        p.tag,
        p.likes_count AS likes,
        p.dislikes_count AS dislikes,
        p.trending,
        p.created_at AS time,
        p.author_id,
        u.name AS author,
        u.profile_picture,
        u.role AS author_role,
        (SELECT type FROM post_likes WHERE post_id = p.id AND user_id = $1) AS user_reaction,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'author', cu.name,
              'profile_picture', cu.profile_picture,
              'content', c.content,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL AND cu.id IS NOT NULL),
          '[]'
        ) AS comments,
        COALESCE(
          json_agg(pi.image_url) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS images
      FROM posts p
      JOIN users u ON u.id = p.author_id
        AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')
      LEFT JOIN comments c ON c.post_id = p.id
      LEFT JOIN users cu ON cu.id = c.author_id
        AND COALESCE(cu.status, 'active') NOT IN ('suspended', 'banned')
      LEFT JOIN post_images pi ON pi.post_id = p.id
      WHERE p.author_id = $1
      GROUP BY p.id, p.author_id, u.name, u.profile_picture, u.role, p.content, p.tag, p.likes_count, p.dislikes_count, p.trending, p.created_at
      ORDER BY p.created_at DESC
    `,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getMyPosts error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  const { content, tag } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!content && (!files || files.length === 0)) {
    console.error("Validation failed: no content and no files");
    return res.status(400).json({ success: false, message: "Post content or at least one image is required" });
  }

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO posts (author_id, content, tag, trending, likes_count, dislikes_count)
       VALUES ($1, $2, $3, false, 0, 0)
       RETURNING id, content, tag, trending, likes_count AS likes, dislikes_count AS dislikes, created_at AS time`,
      [req.user.id, content, tag || "General"]
    );

    const postId = rows[0].id;
    const imageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "community_posts",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(file.buffer);
        });
        imageUrls.push(uploadResult.secure_url);
      }

      const insertPromises = imageUrls.map((url: string) =>
        client.query(`INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`, [postId, url])
      );
      await Promise.all(insertPromises);
    }

    await client.query("COMMIT");

    try {
      if (req.user.role === "student") {
        await addPoints(req.user.id, 5, "Created a community post");
      }
    } catch (e) { console.error("Error giving post points", e); }

    res.json({
      success: true,
      data: {
        ...rows[0],
        author: req.user.name,
        author_id: req.user.id,
        profile_picture: req.user.profile_picture,
        author_role: req.user.role,
        comments: [],
        images: imageUrls,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createPost error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const reactToPost = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const { type } = req.body; 
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!["like", "dislike"].includes(type)) return res.status(400).json({ success: false, message: "Invalid reaction type" });

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const { rowCount: visiblePostCount } = await client.query(
      `SELECT 1
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1
         AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')`,
      [postId]
    );

    if (visiblePostCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const { rows: existingReaction } = await client.query(
      "SELECT id, type FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, req.user.id]
    );

    if (existingReaction.length > 0) {
      const oldType = existingReaction[0].type;
      
      if (oldType === type) {
        
        await client.query("DELETE FROM post_likes WHERE id = $1", [existingReaction[0].id]);
        const field = type === "like" ? "likes_count" : "dislikes_count";
        await client.query(`UPDATE posts SET ${field} = GREATEST(0, ${field} - 1) WHERE id = $1`, [postId]);
      } else {
        
        await client.query("UPDATE post_likes SET type = $1 WHERE id = $2", [type, existingReaction[0].id]);
        
        const removeField = oldType === "like" ? "likes_count" : "dislikes_count";
        const addField = type === "like" ? "likes_count" : "dislikes_count";
        
        await client.query(`UPDATE posts SET 
          ${removeField} = GREATEST(0, ${removeField} - 1),
          ${addField} = ${addField} + 1 
          WHERE id = $1`, [postId]);
      }
    } else {
      
      await client.query(
        "INSERT INTO post_likes (post_id, user_id, type) VALUES ($1, $2, $3)",
        [postId, req.user.id, type]
      );
      const field = type === "like" ? "likes_count" : "dislikes_count";
      await client.query(`UPDATE posts SET ${field} = ${field} + 1 WHERE id = $1`, [postId]);
    }

    const { rows: updatedPost } = await client.query(
      "SELECT id, likes_count AS likes, dislikes_count AS dislikes FROM posts WHERE id = $1",
      [postId]
    );

    await client.query("COMMIT");

    const { rows: currentReaction } = await client.query(
      "SELECT type FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, req.user.id]
    );
    const user_reaction = currentReaction.length > 0 ? currentReaction[0].type : null;

    res.json({ success: true, data: { ...updatedPost[0], user_reaction } });

    if (type === "like" && existingReaction.length === 0) {
      const io = req.app.get("io");
      const { rows: authorRows } = await client.query(`SELECT author_id, content FROM posts WHERE id = $1`, [postId]);
      if (authorRows.length && authorRows[0].author_id !== req.user.id) {
        await createNotification({
          userId: authorRows[0].author_id,
          type: "interaction",
          title: "New Like on your post",
          message: `${req.user.name} liked your post: "${authorRows[0].content.substring(0, 30)}..."`,
          data: { postId },
          io,
        });
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("reactToPost error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const { content } = req.body;
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!content || !content.trim()) return res.status(400).json({ success: false, message: "Comment cannot be empty" });

  const client = await pgPool.connect();
  try {
    const { rowCount: visiblePostCount } = await client.query(
      `SELECT 1
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1
         AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')`,
      [postId]
    );

    if (visiblePostCount === 0) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const { rows } = await client.query(
      `INSERT INTO comments (post_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at AS time`,
      [postId, req.user.id, content]
    );

    const comment = rows[0];
    res.json({ success: true, data: { ...comment, author: req.user.name, profile_picture: req.user.profile_picture } });

    try {
      if (req.user.role === "student") {
        await addPoints(req.user.id, 2, "Commented on a community post");
      }
    } catch (e) { console.error("Error giving comment points", e); }

    const io = req.app.get("io");
    const { rows: authorRows } = await client.query(`SELECT author_id, content FROM posts WHERE id = $1`, [postId]);
    if (authorRows.length && authorRows[0].author_id !== req.user.id) {
      await createNotification({
        userId: authorRows[0].author_id,
        type: "interaction",
        title: "New Comment on your post",
        message: `${req.user.name} commented: "${content.substring(0, 30)}..."`,
        data: { postId },
        io,
      });
    }
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getTags = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(`SELECT name FROM tags ORDER BY name ASC`);
    res.json({ success: true, data: rows.map(r => r.name) });
  } catch (err) {
    console.error("getTags error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Tag cannot be empty" });

  const client = await pgPool.connect();
  try {
    await client.query(`INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING`, [name.trim()]);
    res.json({ success: true, data: name.trim() });
  } catch (err) {
    console.error("createTag error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getTopContributors = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT u.name, u.profile_picture, 
              (SELECT COUNT(*) FROM posts WHERE author_id = u.id) + 
              (SELECT COUNT(*) FROM comments WHERE author_id = u.id) as interaction_count
       FROM users u
       WHERE u.id IN (SELECT author_id FROM posts UNION SELECT author_id FROM comments)
         AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')
       ORDER BY interaction_count DESC
       LIMIT 5`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getTopContributors error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};
