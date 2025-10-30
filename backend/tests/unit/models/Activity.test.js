/**
 * Activity Model Tests
 * Comprehensive tests for Activity model validation and operations
 */

const mongoose = require('mongoose');
const Activity = require('../../../models/Activity');
const dbHelper = require('../../helpers/db-helper');
const { faker } = require('@faker-js/faker');

// Activity factory
const buildActivity = (overrides = {}) => {
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  return {
    activityId: `ACT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    activityName: faker.commerce.productName() + ' Campaign',
    activityType: 'In-Store Promotion',
    customer: new mongoose.Types.ObjectId(),
    customerName: faker.company.name(),
    products: [new mongoose.Types.ObjectId()],
    startDate,
    endDate,
    status: 'Planned',
    budget: {
      allocated: 50000,
      spent: 0
    },
    location: {
      city: faker.location.city(),
      state: faker.location.state(),
      stores: [faker.company.name() + ' Store']
    },
    objectives: 'Increase brand visibility and sales',
    owner: faker.person.fullName(),
    team: [faker.person.fullName()],
    performance: 'Not Started',
    ...overrides
  };
};

describe('Activity Model', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  afterEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('Schema Validation', () => {
    describe('Required Fields', () => {
      it('should create a valid activity with all required fields', async () => {
        const activityData = buildActivity();
        const activity = await Activity.create(activityData);

        expect(activity).toHaveProperty('_id');
        expect(activity.activityId).toBe(activityData.activityId);
        expect(activity.activityName).toBe(activityData.activityName);
        expect(activity.activityType).toBe('In-Store Promotion');
      });

      it('should require activityId field', async () => {
        const activityData = buildActivity({ activityId: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/activityId.*required/i);
      });

      it('should require activityName field', async () => {
        const activityData = buildActivity({ activityName: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/activityName.*required/i);
      });

      it('should require activityType field', async () => {
        const activityData = buildActivity({ activityType: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/activityType.*required/i);
      });

      it('should require customer field', async () => {
        const activityData = buildActivity({ customer: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/customer.*required/i);
      });

      it('should require customerName field', async () => {
        const activityData = buildActivity({ customerName: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/customerName.*required/i);
      });

      it('should require startDate field', async () => {
        const activityData = buildActivity({ startDate: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/startDate.*required/i);
      });

      it('should require endDate field', async () => {
        const activityData = buildActivity({ endDate: undefined });
        await expect(Activity.create(activityData)).rejects.toThrow(/endDate.*required/i);
      });

      it('should require budget.allocated field', async () => {
        const activityData = buildActivity({ budget: { spent: 0 } });
        await expect(Activity.create(activityData)).rejects.toThrow(/budget.*allocated.*required/i);
      });
    });

    describe('ActivityId Uniqueness', () => {
      it('should enforce unique activityId', async () => {
        const activityId = 'ACT-UNIQUE-123';
        const activityData1 = buildActivity({ activityId });
        const activityData2 = buildActivity({ activityId, activityName: 'Different Activity' });

        await Activity.create(activityData1);
        await expect(Activity.create(activityData2)).rejects.toThrow();
      });
    });

    describe('Activity Type Validation', () => {
      it('should validate activityType enum', async () => {
        const activityData = buildActivity({ activityType: 'Invalid Type' });
        await expect(Activity.create(activityData)).rejects.toThrow();
      });

      it('should accept valid activity types', async () => {
        const activityTypes = [
          'In-Store Promotion',
          'Display',
          'Sampling',
          'Demo',
          'Trade Show',
          'Training',
          'Joint Business Planning',
          'Price Promotion',
          'Volume Incentive',
          'Other'
        ];

        for (const activityType of activityTypes) {
          const activityData = buildActivity({ 
            activityType,
            activityId: `ACT-${Date.now()}-${activityType}`.replace(/\s+/g, '-')
          });
          const activity = await Activity.create(activityData);
          expect(activity.activityType).toBe(activityType);
          await Activity.deleteMany({});
        }
      });
    });

    describe('Status Validation', () => {
      it('should validate status enum', async () => {
        const activityData = buildActivity({ status: 'Invalid Status' });
        await expect(Activity.create(activityData)).rejects.toThrow();
      });

      it('should accept valid statuses', async () => {
        const statuses = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'On Hold'];

        for (const status of statuses) {
          const activityData = buildActivity({ 
            status,
            activityId: `ACT-${Date.now()}-${status}`.replace(/\s+/g, '-')
          });
          const activity = await Activity.create(activityData);
          expect(activity.status).toBe(status);
          await Activity.deleteMany({});
        }
      });

      it('should default status to Planned', async () => {
        const activityData = buildActivity({ status: undefined });
        const activity = await Activity.create(activityData);
        expect(activity.status).toBe('Planned');
      });
    });

    describe('Performance Validation', () => {
      it('should validate performance enum', async () => {
        const activityData = buildActivity({ performance: 'Invalid Performance' });
        await expect(Activity.create(activityData)).rejects.toThrow();
      });

      it('should accept valid performance values', async () => {
        const performances = ['Not Started', 'On Track', 'At Risk', 'Delayed', 'Completed'];

        for (const performance of performances) {
          const activityData = buildActivity({ 
            performance,
            activityId: `ACT-${Date.now()}-${performance}`.replace(/\s+/g, '-')
          });
          const activity = await Activity.create(activityData);
          expect(activity.performance).toBe(performance);
          await Activity.deleteMany({});
        }
      });

      it('should default performance to Not Started', async () => {
        const activityData = buildActivity({ performance: undefined });
        const activity = await Activity.create(activityData);
        expect(activity.performance).toBe('Not Started');
      });
    });

    describe('Default Values', () => {
      it('should set default budget.spent to 0', async () => {
        const activityData = buildActivity({ budget: { allocated: 50000 } });
        const activity = await Activity.create(activityData);
        expect(activity.budget.spent).toBe(0);
      });
    });
  });

  describe('Budget Management', () => {
    it('should store budget allocated and spent', async () => {
      const activityData = buildActivity({
        budget: {
          allocated: 100000,
          spent: 35000,
          remaining: 65000
        }
      });
      const activity = await Activity.create(activityData);

      expect(activity.budget.allocated).toBe(100000);
      expect(activity.budget.spent).toBe(35000);
      expect(activity.budget.remaining).toBe(65000);
    });

    it('should update spent amount', async () => {
      const activityData = buildActivity({
        budget: { allocated: 100000, spent: 20000 }
      });
      const activity = await Activity.create(activityData);

      activity.budget.spent = 45000;
      await activity.save();

      const updated = await Activity.findById(activity._id);
      expect(updated.budget.spent).toBe(45000);
    });
  });

  describe('Location Information', () => {
    it('should store location details', async () => {
      const activityData = buildActivity({
        location: {
          city: 'Johannesburg',
          state: 'Gauteng',
          stores: ['Store A', 'Store B', 'Store C']
        }
      });
      const activity = await Activity.create(activityData);

      expect(activity.location.city).toBe('Johannesburg');
      expect(activity.location.state).toBe('Gauteng');
      expect(activity.location.stores).toHaveLength(3);
    });
  });

  describe('Expected and Actual Outcomes', () => {
    it('should store expected outcomes', async () => {
      const activityData = buildActivity({
        expectedOutcome: {
          volumeIncrease: 25,
          revenueTarget: 500000,
          roi: 3.5
        }
      });
      const activity = await Activity.create(activityData);

      expect(activity.expectedOutcome.volumeIncrease).toBe(25);
      expect(activity.expectedOutcome.revenueTarget).toBe(500000);
      expect(activity.expectedOutcome.roi).toBe(3.5);
    });

    it('should store actual outcomes', async () => {
      const activityData = buildActivity({
        actualOutcome: {
          volumeAchieved: 28,
          revenueAchieved: 550000,
          roi: 3.8
        }
      });
      const activity = await Activity.create(activityData);

      expect(activity.actualOutcome.volumeAchieved).toBe(28);
      expect(activity.actualOutcome.revenueAchieved).toBe(550000);
      expect(activity.actualOutcome.roi).toBe(3.8);
    });
  });

  describe('Milestones', () => {
    it('should store milestones array', async () => {
      const activityData = buildActivity({
        milestones: [
          {
            name: 'Setup Complete',
            dueDate: new Date('2025-11-01'),
            completed: true,
            completedDate: new Date('2025-10-30')
          },
          {
            name: 'Campaign Launch',
            dueDate: new Date('2025-11-10'),
            completed: false
          }
        ]
      });
      const activity = await Activity.create(activityData);

      expect(activity.milestones).toHaveLength(2);
      expect(activity.milestones[0].name).toBe('Setup Complete');
      expect(activity.milestones[0].completed).toBe(true);
      expect(activity.milestones[1].completed).toBe(false);
    });

    it('should add new milestone', async () => {
      const activityData = buildActivity({ milestones: [] });
      const activity = await Activity.create(activityData);

      activity.milestones.push({
        name: 'Mid-Campaign Review',
        dueDate: new Date('2025-11-15'),
        completed: false
      });
      await activity.save();

      const updated = await Activity.findById(activity._id);
      expect(updated.milestones).toHaveLength(1);
      expect(updated.milestones[0].name).toBe('Mid-Campaign Review');
    });
  });

  describe('Attachments', () => {
    it('should store attachments array', async () => {
      const activityData = buildActivity({
        attachments: [
          {
            name: 'Campaign Brief.pdf',
            url: 'https://example.com/files/brief.pdf',
            type: 'application/pdf'
          },
          {
            name: 'Store Layout.png',
            url: 'https://example.com/images/layout.png',
            type: 'image/png'
          }
        ]
      });
      const activity = await Activity.create(activityData);

      expect(activity.attachments).toHaveLength(2);
      expect(activity.attachments[0].name).toBe('Campaign Brief.pdf');
      expect(activity.attachments[0].type).toBe('application/pdf');
    });
  });

  describe('Team Management', () => {
    it('should store owner and team members', async () => {
      const activityData = buildActivity({
        owner: 'John Doe',
        team: ['Alice Smith', 'Bob Johnson', 'Carol Williams']
      });
      const activity = await Activity.create(activityData);

      expect(activity.owner).toBe('John Doe');
      expect(activity.team).toHaveLength(3);
      expect(activity.team).toContain('Alice Smith');
    });
  });

  describe('Queries', () => {
    it('should find activities by customer', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await Activity.create([
        buildActivity({ customer: customerId, activityId: 'ACT-1' }),
        buildActivity({ customer: customerId, activityId: 'ACT-2' }),
        buildActivity({ customer: new mongoose.Types.ObjectId(), activityId: 'ACT-3' })
      ]);

      const activities = await Activity.find({ customer: customerId });
      expect(activities).toHaveLength(2);
    });

    it('should find activities by status', async () => {
      await Activity.create([
        buildActivity({ status: 'In Progress', activityId: 'ACT-1' }),
        buildActivity({ status: 'In Progress', activityId: 'ACT-2' }),
        buildActivity({ status: 'Planned', activityId: 'ACT-3' })
      ]);

      const activities = await Activity.find({ status: 'In Progress' });
      expect(activities).toHaveLength(2);
    });

    it('should find activities by activity type', async () => {
      await Activity.create([
        buildActivity({ activityType: 'Trade Show', activityId: 'ACT-1' }),
        buildActivity({ activityType: 'Trade Show', activityId: 'ACT-2' }),
        buildActivity({ activityType: 'Display', activityId: 'ACT-3' })
      ]);

      const activities = await Activity.find({ activityType: 'Trade Show' });
      expect(activities).toHaveLength(2);
    });

    it('should find activities by date range', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');

      await Activity.create([
        buildActivity({ 
          startDate: new Date('2025-11-10'),
          activityId: 'ACT-1'
        }),
        buildActivity({ 
          startDate: new Date('2025-11-20'),
          activityId: 'ACT-2'
        }),
        buildActivity({ 
          startDate: new Date('2025-12-10'),
          activityId: 'ACT-3'
        })
      ]);

      const activities = await Activity.find({
        startDate: { $gte: startDate, $lte: endDate }
      });
      expect(activities).toHaveLength(2);
    });

    it('should find activities by performance', async () => {
      await Activity.create([
        buildActivity({ performance: 'On Track', activityId: 'ACT-1' }),
        buildActivity({ performance: 'On Track', activityId: 'ACT-2' }),
        buildActivity({ performance: 'At Risk', activityId: 'ACT-3' })
      ]);

      const activities = await Activity.find({ performance: 'On Track' });
      expect(activities).toHaveLength(2);
    });
  });

  describe('Updates', () => {
    it('should update activity status', async () => {
      const activityData = buildActivity({ status: 'Planned' });
      const activity = await Activity.create(activityData);

      activity.status = 'In Progress';
      await activity.save();

      const updated = await Activity.findById(activity._id);
      expect(updated.status).toBe('In Progress');
    });

    it('should update performance status', async () => {
      const activityData = buildActivity({ performance: 'Not Started' });
      const activity = await Activity.create(activityData);

      activity.performance = 'On Track';
      await activity.save();

      const updated = await Activity.findById(activity._id);
      expect(updated.performance).toBe('On Track');
    });

    it('should complete milestone', async () => {
      const activityData = buildActivity({
        milestones: [{
          name: 'Setup',
          dueDate: new Date(),
          completed: false
        }]
      });
      const activity = await Activity.create(activityData);

      activity.milestones[0].completed = true;
      activity.milestones[0].completedDate = new Date();
      await activity.save();

      const updated = await Activity.findById(activity._id);
      expect(updated.milestones[0].completed).toBe(true);
      expect(updated.milestones[0].completedDate).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const activityData = buildActivity();
      const activity = await Activity.create(activityData);

      expect(activity.createdAt).toBeDefined();
      expect(activity.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const activityData = buildActivity();
      const activity = await Activity.create(activityData);

      expect(activity.updatedAt).toBeDefined();
      expect(activity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const activityData = buildActivity();
      const activity = await Activity.create(activityData);
      const originalUpdatedAt = activity.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      activity.activityName = 'Updated Activity';
      await activity.save();

      expect(activity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Deletion', () => {
    it('should delete an activity', async () => {
      const activityData = buildActivity();
      const activity = await Activity.create(activityData);
      const activityId = activity._id;

      await Activity.deleteOne({ _id: activityId });

      const deleted = await Activity.findById(activityId);
      expect(deleted).toBeNull();
    });

    it('should delete multiple activities', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await Activity.create([
        buildActivity({ customer: customerId, activityId: 'ACT-1' }),
        buildActivity({ customer: customerId, activityId: 'ACT-2' }),
        buildActivity({ customer: customerId, activityId: 'ACT-3' })
      ]);

      const result = await Activity.deleteMany({ customer: customerId });
      expect(result.deletedCount).toBe(3);
    });
  });
});
