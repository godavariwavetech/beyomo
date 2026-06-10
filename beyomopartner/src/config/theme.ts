export const fonts = {
  primary: 'times-new-roman',
  secondry: 'Arial',
  title: 'DMSans-Bold',
  subTitle: 'DMSans-Regular',
  dmSans: 'DM Sans',
  textInput: "DMSans-Medium",
  textFont: "DMSans-Regular",
};

export const lightTheme = {
  primary: '#064081',        // Main brand color
  secondry: '#02B0E8',       // Accent color
  text: '#414042',           // Default text color

  // Additional extracted colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  darkGray: '#525252',
  lightGray: '#E0E0E0',
  iconGray: '#3D3D3D',
  error: 'red',
  buttonOrange: '#FF9500',
};

export const darkTheme = {
  primary: '#064081',
  secondry: '#02B0E8',
  text: '#FFFFFF',

  // Same colors for dark mode (can be customized differently later)
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  darkGray: '#525252',
  lightGray: '#E0E0E0',
  iconGray: '#3D3D3D',
  error: 'red',
  buttonOrange: '#FF9500',
};

// Theme switcher
const isDarkMode = false; // Replace with Redux or context-based check
export const colors = isDarkMode ? darkTheme : lightTheme;
