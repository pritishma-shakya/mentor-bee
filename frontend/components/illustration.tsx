interface IllustrationProps {
  isMentor: boolean;
}

export default function Illustration({ isMentor }: IllustrationProps) {
  const content =
    isMentor
      ? {
          title: "Share Your Knowledge. Shape Futures.",
          subtitle: "Become a Mentor and Guide Students to Success.",
        }
      : {
          title: "Your Learning Journey Starts Here.",
          subtitle: "Find Expert Mentors to Guide You Every Step.",
        };
  return (
    <div className="hidden md:block bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 m-4 shadow-lg">
      <div className="h-full flex flex-col justify-center items-center text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2 leading-tight">
          {content.title}
        </h2>
        <h3 className="text-base font-semibold text-gray-700 mb-6">
          {content.subtitle}
        </h3>
        <img src="/images/illustration.png" width={500} height={500} />
      </div>
    </div>
  );
}
