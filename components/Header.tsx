import React from 'react';
import { Navbar } from './Navbar';

const HeaderComponent: React.FC = () => {
  return <Navbar />;
};

export const Header = React.memo(HeaderComponent);
