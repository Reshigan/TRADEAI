import axios from '../axios';

export interface Activity {
  _id: string;
  type: string;
  entity: string;
  entityId: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata: any;
  tenantId: string;
}

export const activityService = {
  getAll: async (filters?: any): Promise<Activity[]> => {
    const response = await axios.get('/activity-grid', { params: filters });
    return response.data;
  },

  getByEntity: async (entity: string, entityId: string): Promise<Activity[]> => {
    const response = await axios.get(`/activity-grid/${entity}/${entityId}`);
    return response.data;
  },

  getByUser: async (userId: string): Promise<Activity[]> => {
    const response = await axios.get(`/activity-grid/user/${userId}`);
    return response.data;
  },

  create: async (data: Partial<Activity>): Promise<Activity> => {
    const response = await axios.post('/activity-grid', data);
    return response.data;
  },
};
