declare module 'react-router-dom' {
  import type { 
    RouteProps, 
    RouteComponentProps, 
    RouteChildrenProps, 
    LinkProps, 
    NavLinkProps 
  } from 'react-router-dom';

  export { 
    Routes, 
    Route, 
    Navigate, 
    Link, 
    useLocation, 
    useNavigate, 
    BrowserRouter 
  } from 'react-router-dom/dist/index';
}