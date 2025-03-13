"use client";
import { useState } from "react";
import { User, Trash2, Edit, Plus, Search } from "lucide-react";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { deleteUser, getUsers } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { NeoProgressIndicator } from "./NeoProgresIndicator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserData {
  id: number;
  username: string;
  level: string;
}

export function UserManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("Loading Users...");

  // Get QueryClient instance
  const queryClient = useQueryClient();

  // Fetch users with React Query and search
  const {
    data: users = [],
    isLoading,
    refetch: refetchUsers,
  } = useQuery<UserData[]>({
    queryKey: ["users", searchTerm],
    queryFn: () => getUsers(searchTerm),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: (response) => {
      if (response.status === "Success") {
        toast({
          title: "Berhasil",
          description: "User berhasil dihapus",
        });

        setLoadingMessage("Deleting product...");
        // Both invalidate and explicitly refetch
        queryClient.invalidateQueries({ queryKey: ["users"] });
        refetchUsers(); // Use the explicit refetch function
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.log(error);
      toast({
        title: "Error",
        description: "Gagal menghapus user",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setLoadingMessage("Adding user...");
    refetchUsers(); // Use the explicit refetch function
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search users by username or level"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
        />
        <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
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
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && !isLoading && (
          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-center text-gray-500">{searchTerm ? `Tidak ada user ditemukan untuk "${searchTerm}"` : "Tidak ada user ditemukan"}</p>
          </div>
        )}
      </div>

      {/* Modal Tambah User */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          handleModalClose();
        }}
      />

      {/* Modal Edit User */}
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            handleModalClose();
          }}
          user={selectedUser}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} itemName={userToDelete?.username || ""} subject="User" />

      <NeoProgressIndicator isLoading={isLoading || deleteUserMutation.isPending} message={loadingMessage} />
    </div>
  );
}
