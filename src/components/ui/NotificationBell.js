// src/components/ui/NotificationBell.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { Bell, Circle } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(userNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    if (!notification.isRead) {
      const notifRef = doc(db, "notifications", notification.id);
      await updateDoc(notifRef, { isRead: true });
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-indigo-100 hover:text-white'
      >
        <Bell />
        {unreadCount > 0 && (
          <span className='absolute top-1 right-1 flex h-3 w-3'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-3 w-3 bg-red-500'></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-20'>
          <div className='p-4 font-bold text-slate-800 border-b'>
            Notifications
          </div>
          <div className='max-h-96 overflow-y-auto'>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link}
                  onClick={() => handleNotificationClick(notif)}
                  className={`block p-4 text-sm text-slate-700 hover:bg-slate-50 border-b ${
                    !notif.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    {!notif.isRead && (
                      <Circle className='h-2 w-2 mt-1.5 text-blue-500 fill-current' />
                    )}
                    <span className='flex-1'>{notif.message}</span>
                  </div>
                  <p className='text-xs text-slate-500 mt-1 pl-5'>
                    {new Date(notif.createdAt?.seconds * 1000).toLocaleString()}
                  </p>
                </Link>
              ))
            ) : (
              <p className='p-4 text-center text-slate-500'>
                No notifications yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
