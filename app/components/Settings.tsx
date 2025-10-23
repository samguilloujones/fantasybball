"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  SettingsIcon,
  Mail,
  Key,
  Calendar,
  Clock,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  email: string;
  password: string;
  role: "admin" | "basic";
  createdAt: Date;
  lastLogin?: Date;
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "basic" as "admin" | "basic",
  });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      const mapped = data.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        password: "********",
        role: u.user_metadata?.role || "basic",
        createdAt: new Date(u.created_at),
        lastLogin: u.last_sign_in_at ? new Date(u.last_sign_in_at) : undefined,
      }));

      setUsers(mapped);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return "Email is required";
    if (!formData.email.includes("@")) return "Please enter a valid email address";
    if (!formData.password.trim()) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleAddUser = async () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      const res = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "auth.users",
          action: "insert",
          data: {
            email: formData.email.trim(),
            password: formData.password,
            user_metadata: { role: formData.role },
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to create user");
      await fetchUsers();
      resetForm();
      setIsAddUserOpen(false);
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      const res = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "auth.users",
          action: "update",
          data: { user_metadata: { role: formData.role } },
          match: { id: selectedUser.id },
        }),
      });

      if (!res.ok) throw new Error("Failed to update user");
      await fetchUsers();
      resetForm();
      setIsEditUserOpen(false);
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "auth.users",
          action: "delete",
          match: { id: userId },
        }),
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const openEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      role: user.role,
    });
    setValidationError("");
    setIsEditUserOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      role: "basic",
    });
    setValidationError("");
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-500">
        <CardHeader className="border-b border-green-500 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center text-xl">
                <SettingsIcon className="mr-2 h-5 w-5 text-green-600" />
                League Settings
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage your fantasy basketball league</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsAddUserOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="league">League</TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-green-600" />
                    User Administration
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Manage user access and permissions</p>
                </div>
                <div className="space-y-3">
                  {users.map((user) => (
                    <Card key={user.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === "admin"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditUser(user)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium break-all">{user.email}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-mono text-sm">
                              {showPasswords[user.id] ? user.password : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="h-6 w-6 flex-shrink-0"
                            >
                              {showPasswords[user.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Created: {user.createdAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>Last login: {user.lastLogin?.toLocaleDateString() || "Never"}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={isAddUserOpen || isEditUserOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{isEditUserOpen ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "basic") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="basic">Basic User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddUserOpen(false);
                  setIsEditUserOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={isEditUserOpen ? handleEditUser : handleAddUser}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isEditUserOpen ? "Save Changes" : "Add User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
