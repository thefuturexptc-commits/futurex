import { User, Order, Address } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keys for localStorage
const USERS_KEY = 'novawear_users';
const ORDERS_KEY = 'novawear_orders';
const CURRENT_USER_KEY = 'novawear_current_user';

export const firebaseService = {
  // Auth Simulations
  login: async (email: string, password: string): Promise<User> => {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Explicit Admin Login Logic
    if (email === 'admin@gmail.com') {
        if (password === 'admin123') {
             const admin: User = {
                id: 'admin_1',
                name: 'Super Admin',
                email: 'admin@gmail.com',
                role: 'admin',
                addresses: []
            };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(admin));
            return admin;
        } else {
            throw new Error('Invalid admin credentials');
        }
    }

    // Normal User Login
    // Note: In a real app, never store passwords in plain text. 
    // This is a mock implementation for demo purposes.
    const userRecord = users.find((u: any) => u.email === email);

    if (userRecord) {
      if (userRecord.password === password) {
          const { password, ...user } = userRecord; // Strip password
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          return user as User;
      } else {
          throw new Error('Invalid password');
      }
    }
    
    throw new Error('User not found. Please sign up first.');
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    await delay(1000);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }
    
    // Store password in the record for mock login verification
    const newUserRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      password, // Storing for mock auth verification
      role: 'user',
      addresses: []
    };

    users.push(newUserRecord);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Return user without password
    const { password: _, ...newUser } = newUserRecord;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser as User;
  },

  loginWithGoogle: async (): Promise<User> => {
    await delay(1200);
    // Simulate a Google User
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const email = 'google_user@gmail.com';
    let userRecord = users.find((u: any) => u.email === email);
    
    let user: User;

    if (!userRecord) {
        // Create if doesn't exist
        const newUserRecord = {
            id: 'g_' + Math.random().toString(36).substr(2, 9),
            name: 'Google User',
            email,
            password: 'google_login_no_password', // Placeholder
            role: 'user',
            addresses: [],
            avatar: 'https://picsum.photos/seed/google/200'
        };
        users.push(newUserRecord);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        const { password: _, ...u } = newUserRecord;
        user = u as User;
    } else {
        const { password: _, ...u } = userRecord;
        user = u as User;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  requestPhoneOtp: async (phoneNumber: string, appVerifier?: any): Promise<boolean> => {
    await delay(500);
    console.log(`OTP sent to ${phoneNumber}`);
    return true;
  },

  verifyPhoneOtp: async (phoneNumber: string, otp: string): Promise<User> => {
    await delay(800);
    if (otp !== '123456') throw new Error('Invalid OTP (Use 123456)');
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let userRecord = users.find((u: any) => u.phone === phoneNumber);
    
    let user: User;

    if (!userRecord) {
        const newUserRecord = {
            id: 'p_' + Math.random().toString(36).substr(2, 9),
            name: `User ${phoneNumber.slice(-4)}`,
            email: `${phoneNumber}@phone.com`,
            phone: phoneNumber,
            password: 'phone_login_no_password',
            role: 'user',
            addresses: []
        };
        users.push(newUserRecord);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        const { password: _, ...u } = newUserRecord;
        user = u as User;
    } else {
        const { password: _, ...u } = userRecord;
        user = u as User;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    await delay(300);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Simulate async check
    await delay(100);
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Database Simulations
  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const updatedUserRecord = { ...users[index], ...data };
    users[index] = updatedUserRecord;
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update current session if it's the same user
    const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    if (current.id === userId) {
        const { password: _, ...cleanUser } = updatedUserRecord;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanUser));
        return cleanUser as User;
    }
    
    const { password: _, ...cleanUser } = updatedUserRecord;
    return cleanUser as User;
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
         // Create a clean user object without password for the session
         const { password: _, ...cleanUser } = users[index];
         localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanUser));
         return cleanUser as User;
      }
      
      const { password: _, ...cleanUser } = users[index];
      return cleanUser as User;
  }
};