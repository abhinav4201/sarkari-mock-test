// app/admin/layout.js (or wherever this file is)

import ClientAdminLayout from "@/components/admin/ClientAdminLayout";

export default function Layout({ children }) {
  return <ClientAdminLayout>{children}</ClientAdminLayout>;
}
