export default function Button({ text }: { text: string }) {
  return (
    <button type="submit" 
      className="w-full text-white font-semibold py-2.5 rounded-2xl bg-[#F59E0B] hover:bg-amber-600 transition shadow-md">
        {text}
    </button>
  );
}
