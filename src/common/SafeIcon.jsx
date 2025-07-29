import React from 'react';
import * as FiIcons from 'react-icons/fi';
import { FiAlertTriangle } from 'react-icons/fi';

const SafeIcon = ({ icon, name, ...props }) => {
  let IconComponent;
  try {
    IconComponent = icon || (name && FiIcons[`Fi${name}`]);
  } catch (e) {
    IconComponent = null;
  }

  return IconComponent
    ? React.createElement(IconComponent, props)
    : <FiAlertTriangle {...props} />;
};

export default SafeIcon;