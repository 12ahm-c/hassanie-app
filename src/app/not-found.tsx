import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-semibold text-gray-900">الصفحة غير موجودة</h2>
      <p className="mt-2 text-sm text-gray-500">
        الصفحة التي تبحث عنها غير موجودة.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
