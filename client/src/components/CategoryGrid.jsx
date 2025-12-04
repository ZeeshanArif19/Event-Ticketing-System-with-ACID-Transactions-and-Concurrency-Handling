import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Trophy, Laugh, Laptop, Baby, Theater } from 'lucide-react';
import axios from 'axios';

// Icon mapping for categories from database
const iconMap = {
    'Music': Music,
    'Trophy': Trophy,
    'Laugh': Laugh,
    'Laptop': Laptop,
    'Baby': Baby,
    'Theater': Theater
};

const CategoryGrid = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/categories');
                setCategories(response.data.categories || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="py-8 mb-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-10 mb-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Browse by Category
                    </h2>
                    <p className="text-muted-foreground text-sm">Find events that match your interests</p>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            >
                {categories.map((category) => {
                    const Icon = iconMap[category.icon] || Theater;
                    // Use darker gradient for Entertainment to be visible in light mode
                    let colorClass = category.color || 'from-gray-500 to-gray-600';
                    if (category.id === 'entertainment') {
                        colorClass = 'from-indigo-600 to-purple-600';
                    }
                    return (
                        <motion.button
                            key={category.id}
                            variants={item}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/category/${category.id}`)}
                            className="group flex flex-col items-center p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                        >
                            {/* Icon with gradient background */}
                            <div className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                                <Icon className="w-8 h-8 text-white" />
                            </div>
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {category.name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1 text-center line-clamp-1">
                                {category.description}
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>
        </section>
    );
};

export default CategoryGrid;
