import { User, Order, Address, Product } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keys for localStorage
const USERS_KEY = 'novawear_users';
const ORDERS_KEY = 'novawear_orders';
const CURRENT_USER_KEY = 'novawear_current_user';

export const mockFirebase = {
  // Auth Simulations
  login: async (email: string, password: string): Promise<User> => {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === email);
    
    // For demo purposes, if user doesn't exist but it's admin@nova.com, create admin
    if (email === 'admin@nova.com' && password === 'admin') {
      const admin: User = {
        id: 'admin_1',
        name: 'Super Admin',
        email: 'admin@nova.com',
        role: 'admin',
        addresses: []
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(admin));
      return admin;
    }

    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid credentials');
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    await delay(1000);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: User) => u.email === email)) {
      throw new Error('User already exists');
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: 'user',
      addresses: []
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  loginWithGoogle: async (): Promise<User> => {
    await delay(1200);
    // Simulate a Google User
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const email = 'google_user@gmail.com';
    let user = users.find((u: User) => u.email === email);
    
    if (!user) {
        user = {
            id: 'g_' + Math.random().toString(36).substr(2, 9),
            name: 'Google User',
            email,
            role: 'user',
            addresses: [],
            avatar: 'https://picsum.photos/seed/google/200'
        };
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  requestPhoneOtp: async (phoneNumber: string): Promise<boolean> => {
    await delay(500);
    // Always succeed for demo
    console.log(`OTP sent to ${phoneNumber}`);
    return true;
  },

  verifyPhoneOtp: async (phoneNumber: string, otp: string): Promise<User> => {
    await delay(800);
    if (otp !== '123456') throw new Error('Invalid OTP');
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const email = `${phoneNumber}@phone.com`;
    let user = users.find((u: User) => u.phone === phoneNumber);

    if (!user) {
        user = {
            id: 'p_' + Math.random().toString(36).substr(2, 9),
            name: `User ${phoneNumber.slice(-4)}`,
            email, // Dummy email
            phone: phoneNumber,
            role: 'user',
            addresses: []
        };
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    await delay(300);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Database Simulations
  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const updatedUser = { ...users[index], ...data };
    users[index] = updatedUser;
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update current session if it's the same user
    const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    if (current.id === userId) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
    return updatedUser;
  },

  createOrder: async (order: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
    await delay(1000);
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const newOrder: Order = {
        ...order,
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        status: 'processing'
    };
    orders.push(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  getOrders: async (userId?: string): Promise<Order[]> => {
    await delay(500);
    const orders: Order[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    if (userId) {
        return orders.filter(o => o.userId === userId);
    }
    return orders; // Admin gets all
  },

  addAddress: async (userId: string, address: Omit<Address, 'id'>): Promise<User> => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const index = users.findIndex((u: User) => u.id === userId);
      if (index === -1) throw new Error('User not found');

      const newAddress = { ...address, id: 'addr_' + Math.random().toString(36).substr(2, 9) };
      // If it is default, unset others
      if (newAddress.isDefault) {
          users[index].addresses.forEach((a: Address) => a.isDefault = false);
      }
      users[index].addresses.push(newAddress);
      
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
      if (current.id === userId) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
      }
      return users[index];
  }
};