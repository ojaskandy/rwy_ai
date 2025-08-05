import { type Request } from 'express';
import { supabase } from '../db';

export const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("No authorization token");
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error("Invalid token");
  }

  return user;
};
