import React from 'react';
import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Sparkles,
  HeartPulse,
  Tv,
  GraduationCap,
  MoreHorizontal,
  CreditCard,
  Wallet,
  Briefcase,
  TrendingUp,
  Coins,
  Building,
  Landmark,
  PiggyBank,
  Gift,
  DollarSign,
  Layers,
  PieChart,
  ShieldCheck,
  Building2,
  Clock,
  ArrowDownCircle,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'ShoppingCart':
      return <ShoppingCart className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Building':
    case 'Building2':
      return <Building2 className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'PiggyBank':
      return <PiggyBank className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'DollarSign':
      return <DollarSign className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'PieChart':
      return <PieChart className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'ArrowDownCircle':
      return <ArrowDownCircle className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};
