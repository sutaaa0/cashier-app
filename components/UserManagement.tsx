"use client";
import { useState, useEffect } from "react";
import { User, Trash2, Edit, Plus } from "lucide-react";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { deleteUser, getUsers } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

interface UserData {
  id: number;
  username: string;
  level: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const userData = await getUsers();
      setUsers(userData);
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Gagal mengambil data user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        setIsLoading(true)
        const response = await deleteUser(userToDelete.id);
        if (response.status === "Success") {
          toast({
            title: "Berhasil",
            description: "User berhasil dihapus",
          });
          fetchUsers(); // Refresh data
        } else {
          toast({
            title: "Error",
            description: response.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.log(error);
        toast({
          title: "Error",
          description: "Gagal menghapus user",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false)
      }
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">USER MANAGEMENT</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#93B8F3] border-[3px] border-black rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user.username}</h3>
                  <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-sm font-medium capitalize">{user.level}</span>
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEditClick(user)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteClick(user)}
                  className="p-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah User */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          fetchUsers(); // Refresh data setelah menambah user
        }}
      />

      {/* Modal Edit User */}
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers(); // Refresh data setelah edit user
          }}
          user={selectedUser}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} itemName={userToDelete?.username || ""} subject="User" />

        <NeoProgressIndicator isLoading={isLoading}/>
    </div>
  );
}
