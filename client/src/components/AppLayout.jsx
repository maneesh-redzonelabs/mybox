import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import UpdateProfileModal from './UpdateProfileModal.jsx';

export default function AppLayout() {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">MyBox Portal</div>
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">&#8962;</span> Dashboard
        </NavLink>
        <NavLink to="/family" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">&#128101;</span> My Family
        </NavLink>
        <NavLink to="/policies" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">&#128196;</span> My Policies
        </NavLink>
        <NavLink to="/vehicles" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">&#128663;</span> My Vehicles
        </NavLink>
      </div>

      <div className="main-col">
        <div className="topbar">
          <span className="welcome">Welcome, {user?.name}</span>
          <div className="profile-wrap">
            <div className="profile-icon">{initial}</div>
            <div className="profile-popup">
              <div className="popup-item" onClick={() => setShowProfileModal(true)}>&#9998; Update Profile</div>
              <div className="popup-item danger" onClick={handleSignOut}>&#10148; Sign Out</div>
            </div>
          </div>
        </div>

        <div className="work-area">
          <Outlet />
        </div>
      </div>

      {showProfileModal && (
        <UpdateProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSaved={(updated) => {
            updateUser(updated);
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}
