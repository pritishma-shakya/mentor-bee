export default function InputField({placeholder, type}:{placeholder: string, type: string}) {
    return (
        <input type={type} placeholder={placeholder}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"/>
    )
}