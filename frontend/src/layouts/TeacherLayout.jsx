import CustomHeader from "@/components/CustomHeader";
import AppSidebar from "@/components/CustomSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  FilePlus2,
  HandCoins,
  House,
  MessageSquareText,
  StickyNote,
  BookOpen,
  Star,
  Wallet,
  CreditCard,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const items = [
  {
    title: "Dashboard",
    url: "/teacher/dashboard",
    icon: <House />,
  },
  {
    title: "Explore Requests",
    url: "/teacher/explore-requests",
    icon: <StickyNote />,
  },
  {
    title: "Offered",
    url: "/teacher/offered",
    icon: <HandCoins />,
  },
  {
    title: "Courses",
    url: "/teacher/courses",
    icon: <BookOpen />,
  },
  {
    title: "Earnings",
    url: "/teacher/earnings",
    icon: <Wallet />,
  },
  {
    title: "Reviews",
    url: "/teacher/reviews",
    icon: <Star />,
  },
  {
    title: "Payment Settings",
    url: "/teacher/payment-settings",
    icon: <CreditCard />,
  },
];

const TeacherLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar items={items} />
      <main className="w-full flex flex-col">
        <CustomHeader />
        <section className="px-6 py-4 bg-gray-100/20 h-screen">
          <Outlet />
        </section>
      </main>
    </SidebarProvider>
  );
};

export default TeacherLayout;
