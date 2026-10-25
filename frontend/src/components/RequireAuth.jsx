import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { selectUser } from '../redux/authSlice';

export default function RequireAuth({ children }) {
    const user = useSelector(selectUser);
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
}
