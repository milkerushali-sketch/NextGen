import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBell,
  FaChartBar,
  FaCog,
  FaEdit,
  FaFileAlt,
  FaHome,
  FaListAlt,
  FaLock,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaTable,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  ["Home", FaHome, "/"],
  ["Table", FaTable, "#"],
  ["Menu", FaListAlt, "#"],
  ["Order", FaFileAlt, "/orders"],
  ["History", FaFileAlt, "/orders"],
  ["Report", FaChartBar, "#"],
  ["Alert", FaBell, "#"],
  ["Settings", FaCog, "#"],
];
const getDetails = (user) => ({
  gender: user?.gender || "",
  firstName: user?.firstName || user?.name?.split(" ")[0] || "",
  lastName: user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
  email: user?.email || "",
  address: user?.address || "",
  phone: user?.phone || "",
  dateOfBirth: user?.dateOfBirth || "",
  location: user?.location || "",
  pinCode: user?.pinCode || "",
});
const fields = [
  ["firstName", "First Name"],
  ["lastName", "Last Name"],
  ["email", "Email"],
  ["address", "Address"],
  ["phone", "Phone Number"],
  ["dateOfBirth", "Date of Birth"],
  ["location", "Location"],
  ["pinCode", "Pin Code"],
];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Personal Information");
  const [details, setDetails] = useState(() => getDetails(user));
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [imageKey, setImageKey] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result);
      setImageKey((key) => key + 1);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };
  const handleChange = (event) => {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };
  const saveChanges = (event) => {
    event.preventDefault();
    const name = `${details.firstName} ${details.lastName}`.trim();
    updateUser({ ...details, name: name || user?.name, profileImage });
    setSaved(true);
  };
  const discardChanges = () => {
    setDetails(getDetails(user));
    setProfileImage(user?.profileImage || "");
    setSaved(false);
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="min-h-[calc(100vh-77px)] bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl gap-6">
        <aside className="hidden w-60 shrink-0 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
          <div className="mb-7 px-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Workspace
            </div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
              NovaCart dashboard
            </div>
          </div>
          <nav className="space-y-1">
            {navigation.map(([label, Icon, href]) => (
              <Link
                key={label}
                to={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Icon className="w-4" />
                {label}
              </Link>
            ))}
            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-xl bg-orange-500 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
              >
                <FaUserCircle className="w-4" />
                Your NovaCart Account
              </Link>
            </div>
          </nav>
        </aside>
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-0 flex-1"
        >
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {profileImage ? (
                  <motion.img
                    key={imageKey}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={profileImage}
                    alt="Profile"
                    className="h-28 w-28 rounded-full border-4 border-orange-100 object-cover shadow-md"
                  />
                ) : (
                  <FaUserCircle className="h-28 w-28 text-slate-200 dark:text-slate-700" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-md transition hover:scale-105"
                  aria-label="Change profile photo"
                >
                  <FaEdit />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                  Account overview
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                  Your NovaCart Account
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {user?.name || "NovaCart shopper"}{" "}
                  <span className="mx-2">•</span> Premium shopper
                </p>
              </div>
            </div>
          </motion.header>
          <div className="mt-6 grid gap-6 xl:grid-cols-[200px_1fr]">
            <nav className="flex gap-2 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
              {["Personal Information", "Login & Password"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex min-w-max items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold xl:w-full ${activeTab === tab ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400"}`}
                >
                  {tab === "Personal Information" ? (
                    <FaUserCircle />
                  ) : (
                    <FaLock />
                  )}
                  {tab}
                </button>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-w-max items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-500 xl:mt-5 xl:w-full"
              >
                <FaSignOutAlt />
                Log Out
              </button>
            </nav>
            {activeTab === "Personal Information" ? (
              <motion.form
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={saveChanges}
                className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Personal Information
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Keep your account details up to date.
                    </p>
                  </div>
                  <FaMapMarkerAlt className="text-orange-500" />
                </div>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Gender
                    </legend>
                    <div className="flex gap-6">
                      {["Female", "Male", "Other"].map((gender) => (
                        <label
                          key={gender}
                          className="flex items-center gap-2 text-sm text-slate-500"
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={gender}
                            checked={details.gender === gender}
                            onChange={handleChange}
                            className="accent-orange-500"
                          />
                          {gender}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {fields.map(([name, label]) => (
                    <label
                      key={name}
                      className={name === "address" ? "sm:col-span-2" : ""}
                    >
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {label}
                        {name === "email" && (
                          <span className="ml-2 text-xs text-emerald-500">
                            Verified
                          </span>
                        )}
                      </span>
                      <input
                        name={name}
                        type={
                          name === "dateOfBirth"
                            ? "date"
                            : name === "email"
                              ? "email"
                              : "text"
                        }
                        value={details[name]}
                        onChange={handleChange}
                        readOnly={name === "email"}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <span className="mr-auto text-sm font-semibold text-emerald-500">
                    {saved ? "Changes saved" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={discardChanges}
                    className="inline-flex items-center gap-2 rounded-xl border border-orange-300 px-5 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50"
                  >
                    <FaTimes />
                    Discard Changes
                  </button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    type="submit"
                    className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Login & Password
                </h2>
                <p className="mt-3 text-slate-500">
                  Your login credentials are managed securely by NovaCart.
                </p>
              </motion.div>
            )}
            +{" "}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
