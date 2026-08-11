import Link from "next/link";
import { FileText, Languages } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actionCards = [
  {
    title: "ترجمة",
    description: "إدارة الجمل العربية وترجمتها إلى الحسانية ثم تصديرها.",
    href: "/sentences",
    icon: Languages,
  },
  {
    title: "جمل فردي Mono",
    description: "تنظيف ملف نصي أو نص مباشر ورفعه إلى مستودع mono.",
    href: "/mono",
    icon: FileText,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-4xl items-center">
      <div className="w-full space-y-6" dir="rtl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">اختر نوع العمل</h1>
          <p className="text-sm text-gray-500">
            ابدأ بمسار الترجمة أو مسار الجمل الفردية.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {actionCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link key={card.href} href={card.href} className="block">
                <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-gray-900">{card.title}</h2>
                      <p className="text-sm leading-6 text-gray-600">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
