import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// The history, location and match props that react-router 5 gave to the views, built on the
// hooks of react-router 6+. history.push takes { pathname, hash, state }, like before.
export default function withRouter(Component) {
  return function WithRouter(props) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const params    = useParams();
    const history   = {
      push:     ({ state, ...to }) => navigate(to, { state }),
      replace:  to => navigate(to, { replace: true })
    };

    return <Component {...props} history={history} location={location} match={{ params }} />;
  };
}
