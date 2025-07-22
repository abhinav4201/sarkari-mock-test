"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import { Search } from "lucide-react";

export default function TestSearchModal({ isOpen, onClose, onTestSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const q = query(
        collection(db, "mockTests"),
        where("title_lowercase", ">=", lowercasedSearchTerm),
        where("title_lowercase", "<=", lowercasedSearchTerm + "\uf8ff"),
        limit(15)
      );
      const snapshot = await getDocs(q);
      setResults(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (snapshot.empty) {
        toast.error("No tests found with that title.");
      }
    } catch (error) {
      toast.error("Failed to search for tests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (test) => {
    onTestSelect(test);
    onClose();
    // Reset state for next time
    setSearchTerm("");
    setResults([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Search and Select a Mock Test'
    >
      <div className='p-1'>
        <form onSubmit={handleSearch} className='flex gap-2 mb-4'>
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
            className='px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400'
          >
            <Search />
          </button>
        </form>
        <div className='space-y-2 max-h-80 overflow-y-auto'>
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className='w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors'
            >
              <p className='font-semibold text-slate-900'>{item.title}</p>
              <p className='text-sm text-slate-500'>ID: {item.id}</p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
