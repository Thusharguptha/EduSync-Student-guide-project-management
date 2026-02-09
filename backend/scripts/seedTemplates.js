import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MilestoneTemplate from '../models/MilestoneTemplate.js';
import connectDB from '../config/db.js';

dotenv.config();

const defaultTemplates = [
    {
        name: 'Web Development Project',
        description: 'Full-stack web application development with frontend, backend, and deployment',
        category: 'web',
        milestones: [
            {
                title: 'Project Proposal',
                description: 'Submit project proposal with requirements and design',
                estimatedDays: 7,
                order: 0
            },
            {
                title: 'Frontend Development',
                description: 'Build user interface and components',
                estimatedDays: 14,
                order: 1
            },
            {
                title: 'Backend Development',
                description: 'Develop API and database integration',
                estimatedDays: 14,
                order: 2
            },
            {
                title: 'Integration & Testing',
                description: 'Integrate frontend/backend and perform testing',
                estimatedDays: 10,
                order: 3
            },
            {
                title: 'Deployment & Documentation',
                description: 'Deploy application and complete documentation',
                estimatedDays: 5,
                order: 4
            }
        ],
        isDefault: true,
        isPublic: true
    },
    {
        name: 'Mobile App Development',
        description: 'Cross-platform or native mobile application development',
        category: 'mobile',
        milestones: [
            {
                title: 'Project Proposal',
                description: 'Submit project proposal with app design and features',
                estimatedDays: 7,
                order: 0
            },
            {
                title: 'UI/UX Design',
                description: 'Create wireframes and design user interface',
                estimatedDays: 10,
                order: 1
            },
            {
                title: 'App Development',
                description: 'Develop mobile app with core features',
                estimatedDays: 18,
                order: 2
            },
            {
                title: 'API Integration & Testing',
                description: 'Integrate backend APIs and test on devices',
                estimatedDays: 10,
                order: 3
            },
            {
                title: 'Deployment & Release',
                description: 'Deploy to app stores and complete documentation',
                estimatedDays: 5,
                order: 4
            }
        ],
        isDefault: true,
        isPublic: true
    },
    {
        name: 'Research Project',
        description: 'Academic research project with literature review and analysis',
        category: 'research',
        milestones: [
            {
                title: 'Project Proposal',
                description: 'Submit research proposal with objectives',
                estimatedDays: 7,
                order: 0
            },
            {
                title: 'Literature Review',
                description: 'Comprehensive literature review of related work',
                estimatedDays: 14,
                order: 1
            },
            {
                title: 'Methodology & Data Collection',
                description: 'Design methodology and collect research data',
                estimatedDays: 14,
                order: 2
            },
            {
                title: 'Data Analysis',
                description: 'Analyze collected data and generate results',
                estimatedDays: 10,
                order: 3
            },
            {
                title: 'Paper Writing & Submission',
                description: 'Write research paper and prepare for submission',
                estimatedDays: 10,
                order: 4
            }
        ],
        isDefault: true,
        isPublic: true
    },
    {
        name: 'Machine Learning Project',
        description: 'ML/AI project with data processing, model development, and evaluation',
        category: 'ml',
        milestones: [
            {
                title: 'Project Proposal',
                description: 'Submit ML project proposal with problem statement',
                estimatedDays: 7,
                order: 0
            },
            {
                title: 'Data Collection & Preprocessing',
                description: 'Collect and preprocess dataset',
                estimatedDays: 12,
                order: 1
            },
            {
                title: 'Model Development',
                description: 'Develop and implement ML model architecture',
                estimatedDays: 15,
                order: 2
            },
            {
                title: 'Training & Optimization',
                description: 'Train model and optimize hyperparameters',
                estimatedDays: 10,
                order: 3
            },
            {
                title: 'Evaluation & Deployment',
                description: 'Evaluate model performance and deploy',
                estimatedDays: 6,
                order: 4
            }
        ],
        isDefault: true,
        isPublic: true
    },
    {
        name: 'General Project',
        description: 'General project template suitable for any project type',
        category: 'general',
        milestones: [
            {
                title: 'Project Proposal',
                description: 'Submit initial project proposal',
                estimatedDays: 7,
                order: 0
            },
            {
                title: 'Planning & Design',
                description: 'Plan architecture and design system',
                estimatedDays: 10,
                order: 1
            },
            {
                title: 'Development',
                description: 'Develop the project',
                estimatedDays: 20,
                order: 2
            },
            {
                title: 'Testing & Documentation',
                description: 'Test and document the project',
                estimatedDays: 10,
                order: 3
            },
            {
                title: 'Final Submission',
                description: 'Submit final project with presentation',
                estimatedDays: 5,
                order: 4
            }
        ],
        isDefault: true,
        isPublic: true
    }
];

const seedTemplates = async () => {
    try {
        await connectDB();

        // Clear existing default templates
        await MilestoneTemplate.deleteMany({ isDefault: true });

        // Insert new default templates
        const templates = await MilestoneTemplate.insertMany(defaultTemplates);

        console.log(`✅ Successfully seeded ${templates.length} milestone templates:`);
        templates.forEach(t => console.log(`   - ${t.name} (${t.category})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates();
