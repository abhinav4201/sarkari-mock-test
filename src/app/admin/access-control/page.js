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
import { Search, UserPlus, Trash2 } from "lucide-react";
import Cookies from "js-cookie";

const TestSelector = ({ onTestSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "mockTests"),
        where("title", ">=", searchTerm),
        where("title", "<=", searchTerm + "\uf8ff"),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setResults(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Failed to search tests.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border'>
      <h2 className='text-xl font-bold text-slate-900 mb-4'>
        1. Select a Test
      </h2>
      <form onSubmit={handleSearch} className='flex gap-2'>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Search for a test by title...'
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
        {results.map((test) => (
          <button
            key={test.id}
            onClick={() => onTestSelect(test)}
            className='w-full text-left p-3 rounded-lg hover:bg-slate-100'
          >
            <p className='font-semibold text-slate-900'>{test.title}</p>
            <p className='text-sm text-slate-600'>{test.subject}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const AccessManager = ({ test, onUpdate }) => {
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchAllowedUsers = async () => {
      setLoadingUsers(true);
      setAllowedUsers([]);
      if (!test?.allowedUserIds || test.allowedUserIds.length === 0) {
        setLoadingUsers(false);
        return;
      }

      try {
        const userIds = test.allowedUserIds;
        const fetchedUsers = [];

        // FIX: Firestore 'in' queries only support 10 items per request.
        // This logic breaks the user ID array into chunks of 10 to fetch them all.
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
        console.error("Error fetching allowed users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (test?.id) {
      fetchAllowedUsers();
    }
  }, [test]);

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
    try {
      const testRef = doc(db, "mockTests", test.id);
      await updateDoc(testRef, {
        allowedUserIds: arrayUnion(foundUser.uid),
      });
      toast.success(`Access granted to ${foundUser.email}`);
      setFoundUser(null);
      setUserSearch("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to grant access.");
    }
  };

  const handleRevokeAccess = async (userToRevoke) => {
    try {
      const testRef = doc(db, "mockTests", test.id);
      await updateDoc(testRef, {
        allowedUserIds: arrayRemove(userToRevoke.uid),
      });
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
      <p className='text-indigo-600 font-semibold text-lg mb-6'>{test.title}</p>
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
              className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg'
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
              <button
                onClick={handleGrantAccess}
                className='p-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
              >
                <UserPlus />
              </button>
            </div>
          )}
        </div>
        <div>
          <h3 className='font-bold text-slate-800 mb-3'>
            Allowed Users ({allowedUsers.length})
          </h3>
          <div className='space-y-2 max-h-60 overflow-y-auto'>
            {loadingUsers ? (
              <p className='text-sm text-slate-500 p-3'>Loading...</p>
            ) : allowedUsers.length > 0 ? (
              allowedUsers.map((user) => (
                <div
                  key={user.uid}
                  className='p-3 bg-slate-50 text-slate-900 border rounded-lg flex justify-between items-center'
                >
                  <div>
                    <p className='font-semibold'>{user.name}</p>
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
                This test is currently public. Grant access to make it
                restricted.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AccessControlPage() {
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const savedTestJson = Cookies.get("selectedAccessControlTest");
    if (savedTestJson) {
      try {
        setSelectedTest(JSON.parse(savedTestJson));
      } catch (e) {
        console.error("Failed to parse saved test from cookie", e);
        Cookies.remove("selectedAccessControlTest");
      }
    }
  }, []);

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    Cookies.set("selectedAccessControlTest", JSON.stringify(test), {
      expires: 1,
    });
  };

  const refreshSelectedTest = async () => {
    if (!selectedTest) return;
    try {
      const testRef = doc(db, "mockTests", selectedTest.id);
      const freshTestSnap = await getDoc(testRef);
      if (freshTestSnap.exists()) {
        const updatedTest = { id: freshTestSnap.id, ...freshTestSnap.data() };
        setSelectedTest(updatedTest);
        Cookies.set("selectedAccessControlTest", JSON.stringify(updatedTest), {
          expires: 1,
        });
      } else {
        toast.error("Test no longer exists.");
        setSelectedTest(null);
      }
    } catch {
      toast.error("Failed to refresh test data.");
    }
  };

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>Access Control</h1>
      <TestSelector onTestSelect={handleTestSelect} />
      {selectedTest && (
        <AccessManager test={selectedTest} onUpdate={refreshSelectedTest} />
      )}
    </div>
  );
}
