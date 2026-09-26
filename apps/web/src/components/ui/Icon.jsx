import {
  Calendar,
  Code2,
  FlaskConical,
  Gauge,
  HeartHandshake,
  Layout,
  LifeBuoy,
  LogIn,
  Mail,
  MapPin,
  PencilRuler,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Smile,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Workflow,
  Wrench,
} from 'lucide-react'

const ICONS = {
  Calendar,
  Code2,
  FlaskConical,
  Gauge,
  HeartHandshake,
  Layout,
  LifeBuoy,
  LogIn,
  Mail,
  MapPin,
  PencilRuler,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Smile,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Workflow,
  Wrench,
}

export default function Icon({ name, className, ...props }) {
  const Cmp = ICONS[name]
  if (!Cmp) return null
  return <Cmp className={className} aria-hidden="true" {...props} />
}
