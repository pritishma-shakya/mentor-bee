import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { pgPool } from "../config/database";
import crypto from "crypto";

export const generateSignature = async (req: AuthRequest, res: Response) => {
    const { total_amount, transaction_uuid, product_code } = req.body;


    const secretKey = process.env.ESEWA_SECRET_KEY;

    if (!secretKey) {
        console.error("ESEWA_SECRET_KEY is not defined in the environment");
        res.status(500).json({ message: "Payment configuration error" });
        return;
    }

    const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

    try {
        const signature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');
        res.json({
            signature,
            message: "Signature generated successfully"
        });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ message: "Payment processing failed" });
    }
};