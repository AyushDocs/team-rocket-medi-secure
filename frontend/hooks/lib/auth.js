// Auth utilities
export const logout = async () => {
  try {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('walletAddress');
    
    // Call logout endpoint
    await fetch('http://localhost:4000/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Redirect to home/login page
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if API call fails
    window.location.href = '/';
  }
};