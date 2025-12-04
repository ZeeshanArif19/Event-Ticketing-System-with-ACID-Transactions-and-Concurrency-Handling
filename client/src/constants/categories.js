import { Music, Trophy, Laugh, Laptop, Baby } from 'lucide-react';

export const categories = [
    {
        id: 'music',
        name: 'Music',
        description: 'Live concerts, festivals, and music events',
        icon: Music,
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: 'sports',
        name: 'Sports',
        description: 'Sporting events, matches, and tournaments',
        icon: Trophy,
        color: 'from-green-500 to-emerald-500',
    },
    {
        id: 'comedy',
        name: 'Comedy',
        description: 'Stand-up shows and comedy nights',
        icon: Laugh,
        color: 'from-yellow-500 to-orange-500',
    },
    {
        id: 'tech',
        name: 'Tech',
        description: 'Tech conferences, workshops, and meetups',
        icon: Laptop,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'kids',
        name: 'Kids',
        description: 'Family-friendly events and activities',
        icon: Baby,
        color: 'from-pink-500 to-rose-500',
    },
];

export const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id?.toLowerCase());
};

export const getCategoryByName = (name) => {
    return categories.find(cat => cat.name.toLowerCase() === name?.toLowerCase());
};
