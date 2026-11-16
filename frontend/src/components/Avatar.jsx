import { initials } from '../utils/format';

function Avatar({ user, className = '' }) {
  const cls = `avatar ${className}`.trim();
  if (user?.profilePicture) {
    return <img src={user.profilePicture} alt="" className={cls} />;
  }
  return <span className={cls}>{initials(user?.name)}</span>;
}

export default Avatar;
