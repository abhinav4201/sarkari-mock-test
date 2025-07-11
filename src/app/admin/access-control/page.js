"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  limit,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Search, UserPlus, Trash2, StopCircle } from "lucide-react";
import Cookies from "js-cookie";
import BulkAccessManager from "@/components/admin/BulkAccessManager";

// This component is now generic to handle any content type
const ContentSelector = ({ contentType, onContentSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setIsLoading(true);
    try {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const q = query(
        collection(db, contentType),
        where("title_lowercase", ">=", lowercasedSearchTerm),
        where("title_lowercase", "<=", lowercasedSearchTerm + "\uf8ff"),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setResults(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error(`Failed to search ${contentType}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border'>
      <h2 className='text-xl font-bold text-slate-900 mb-4'>
        1. Select Content
      </h2>
      <form onSubmit={handleSearch} className='flex gap-2'>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search for a ${
            contentType === "mockTests" ? "Test" : "Blog Post"
          } by title...`}
          className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg'
        />
        <button
          type='submit'
          disabled={isLoading}
          className='px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700'
        >
          <Search />
        </button>
      </form>
      <div className='mt-4 space-y-2 max-h-60 overflow-y-auto'>
        {results.map((item) => (
          <button
            key={item.id}
            onClick={() => onContentSelect(item)}
            className='w-full text-left p-3 rounded-lg hover:bg-slate-100'
          >
            <p className='font-semibold text-slate-900'>{item.title}</p>
            <p className='text-sm text-slate-600'>
              {item.subject || item.slug}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// This component is also now generic
const AccessManager = ({ content, contentType, onUpdate }) => {
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchAllowedUsers = async () => {
      setLoadingUsers(true);
      if (!content?.allowedUserIds || content.allowedUserIds.length === 0) {
        setAllowedUsers([]);
        setLoadingUsers(false);
        return;
      }
      try {
        const userIds = content.allowedUserIds;
        const fetchedUsers = [];
        for (let i = 0; i < userIds.length; i += 10) {
          const chunk = userIds.slice(i, i + 10);
          const usersQuery = query(
            collection(db, "users"),
            where("uid", "in", chunk)
          );
          const snapshot = await getDocs(usersQuery);
          snapshot.forEach((doc) => fetchedUsers.push(doc.data()));
        }
        setAllowedUsers(fetchedUsers);
      } catch (error) {
        toast.error("Could not fetch allowed users.");
      } finally {
        setLoadingUsers(false);
      }
    };
    if (content?.id) {
      fetchAllowedUsers();
    }
  }, [content]);

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setFoundUser(null);
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", userSearch),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        toast.error("No user found with that email.");
      } else {
        setFoundUser(snapshot.docs[0].data());
      }
    } catch (error) {
      toast.error("Failed to search for user.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGrantAccess = async () => {
    const contentRef = doc(db, contentType, content.id);
    try {
      const isFirstUser =
        !content.allowedUserIds || content.allowedUserIds.length === 0;
      const dataToUpdate = { allowedUserIds: arrayUnion(foundUser.uid) };
      if (isFirstUser) {
        dataToUpdate.isRestricted = true;
      }
      await updateDoc(contentRef, dataToUpdate);
      toast.success(`Access granted to ${foundUser.email}`);
      setFoundUser(null);
      setUserSearch("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to grant access.");
    }
  };

  const handleRevokeAccess = async (userToRevoke) => {
    const contentRef = doc(db, contentType, content.id);
    try {
      const isLastUser =
        content.allowedUserIds && content.allowedUserIds.length === 1;
      const dataToUpdate = { allowedUserIds: arrayRemove(userToRevoke.uid) };
      if (isLastUser) {
        dataToUpdate.isRestricted = false;
      }
      await updateDoc(contentRef, dataToUpdate);
      toast.success(`Access revoked for ${userToRevoke.email}`);
      onUpdate();
    } catch (error) {
      toast.error("Failed to revoke access.");
    }
  };

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border mt-8'>
      <h2 className='text-xl font-bold text-slate-900 mb-1'>
        2. Manage Access for:
      </h2>
      <p className='text-indigo-600 font-semibold text-lg mb-6'>
        {content.title}
      </p>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <div>
          <h3 className='font-bold text-slate-800 mb-3'>
            Grant Access to User
          </h3>
          <form onSubmit={handleUserSearch} className='flex gap-2'>
            <input
              type='email'
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder='Search user by email...'
              className='w-full text-slate-900 p-3 border border-slate-300 rounded-lg'
            />
            <button
              type='submit'
              disabled={isSearching}
              className='px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300'
            >
              <Search />
            </button>
          </form>
          {foundUser && (
            <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center'>
              <div>
                <p className='font-semibold text-slate-900'>{foundUser.name}</p>
                <p className='text-sm text-slate-600'>{foundUser.email}</p>
              </div>
              {allowedUsers.some((user) => user.uid === foundUser.uid) ? (
                <div className='relative group'>
                  <button
                    disabled
                    className='p-2 bg-slate-400 text-white rounded-lg cursor-not-allowed'
                  >
                    <StopCircle />
                  </button>
                  <span className='absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-2 py-1 bg-slate-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
                    Already Added
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleGrantAccess}
                  className='p-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                >
                  <UserPlus />
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <h3 className='font-bold text-slate-800 mb-3'>
            Allowed Users ({allowedUsers.length})
          </h3>
          <div className='space-y-2 max-h-60 overflow-y-auto'>
            {loadingUsers ? (
              <p className='text-sm text-slate-500'>Loading...</p>
            ) : allowedUsers.length > 0 ? (
              allowedUsers.map((user) => (
                <div
                  key={user.uid}
                  className='p-3 bg-slate-50 border rounded-lg flex justify-between items-center'
                >
                  <div>
                    <p className='font-semibold text-slate-900'>{user.name}</p>
                    <p className='text-sm text-slate-600'>{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleRevokeAccess(user)}
                    className='p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200'
                  >
                    <Trash2 />
                  </button>
                </div>
              ))
            ) : (
              <p className='text-sm text-slate-500 p-3 bg-slate-50 border rounded-lg'>
                This content is public. Grant access to make it restricted.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AccessControlPage() {
  const [contentType, setContentType] = useState("mockTests");
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    const savedContentJson = Cookies.get(
      `selectedAccessControl_${contentType}`
    );
    if (savedContentJson) {
      try {
        setSelectedContent(JSON.parse(savedContentJson));
      } catch (e) {
        Cookies.remove(`selectedAccessControl_${contentType}`);
      }
    }
  }, [contentType]);

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedContent(null);
  };

  const handleContentSelect = (item) => {
    setSelectedContent(item);
    Cookies.set(`selectedAccessControl_${contentType}`, JSON.stringify(item), {
      expires: 1,
    });
  };

  const refreshSelectedContent = async () => {
    if (!selectedContent) return;
    try {
      const contentRef = doc(db, contentType, selectedContent.id);
      const freshSnap = await getDoc(contentRef);
      if (freshSnap.exists()) {
        const updatedContent = { id: freshSnap.id, ...freshSnap.data() };
        setSelectedContent(updatedContent);
        Cookies.set(
          `selectedAccessControl_${contentType}`,
          JSON.stringify(updatedContent),
          { expires: 1 }
        );
      } else {
        setSelectedContent(null);
      }
    } catch {
      toast.error("Failed to refresh content data.");
    }
  };

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>Access Control</h1>
      <div className='mb-6 flex space-x-2 p-1 bg-slate-200 rounded-lg'>
        <button
          onClick={() => handleContentTypeChange("mockTests")}
          className={`w-full p-2 rounded-md font-semibold ${
            contentType === "mockTests"
              ? "bg-white text-indigo-600 shadow"
              : "text-slate-700"
          }`}
        >
          Mock Tests
        </button>
        <button
          onClick={() => handleContentTypeChange("posts")}
          className={`w-full p-2 rounded-md font-semibold ${
            contentType === "posts"
              ? "bg-white text-indigo-600 shadow"
              : "text-slate-700"
          }`}
        >
          Blog Posts
        </button>
      </div>
      <ContentSelector
        contentType={contentType}
        onContentSelect={handleContentSelect}
      />
      {selectedContent && (
        <AccessManager
          content={selectedContent}
          contentType={contentType}
          onUpdate={refreshSelectedContent}
        />
      )}
      <BulkAccessManager
        contentType={contentType}
        onUpdate={refreshSelectedContent}
      />
    </div>
  );
}
