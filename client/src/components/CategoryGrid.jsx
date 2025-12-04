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
                // Fallback to empty array if API fails
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="py-12 mb-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <div className="py-12 mb-12">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Browse by <span className="text-gradient">Category</span>
                    </h2>
                    <button className="text-primary hover:text-primary/80 font-semibold text-sm hidden md:block">
                        View All Categories
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    {categories.map((category, index) => {
                        const Icon = iconMap[category.icon] || Theater;
                        return (
                            <motion.button
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/category/${category.id}`)}
                                className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-center overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg group-hover:shadow-primary/30 group-hover:scale-110 transition-all duration-300`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>

                                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80">
                                    {category.description}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CategoryGrid;
