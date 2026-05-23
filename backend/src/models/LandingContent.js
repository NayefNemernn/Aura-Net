const mongoose = require('mongoose');

const mediaItem = new mongoose.Schema({
  type:        { type: String, enum: ['youtube','photo'], required: true },
  url:         { type: String, default: '' },
  videoId:     { type: String, default: '' },
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  order:       { type: Number, default: 0 },
}, { _id: true });

const planItem = new mongoose.Schema({
  name:     { type: String, default: '' },
  speed:    { type: String, default: '' },
  price:    { type: Number, default: 0 },
  color:    { type: String, default: '#0070ff' },
  hot:      { type: Boolean, default: false },
  features: [String],
}, { _id: true });

const offerItem = new mongoose.Schema({
  speed: { type: String, default: '' },
  price: { type: String, default: '' },
  tag:   { type: String, default: '' },
  color: { type: String, default: '#00d4ff' },
}, { _id: true });

const s = new mongoose.Schema({
  _key: { type: String, default: 'main', unique: true },

  hero: {
    badge:    { type: String, default: 'Fiber-Optic Network Provider' },
    title1:   { type: String, default: 'Blazing Fast' },
    title2:   { type: String, default: 'Fiber Internet' },
    title3:   { type: String, default: 'For Everyone' },
    subtitle: { type: String, default: 'Experience the power of pure fiber optics — ultra-low latency, symmetric speeds, and 99.9% uptime backed by 24/7 local support.' },
    cta1:     { type: String, default: 'View All Plans' },
    cta2:     { type: String, default: 'Client Login' },
  },

  offers: { type: [offerItem], default: [
    { speed:'50 Mbps',  price:'$29', tag:'Starter',      color:'#00d4ff' },
    { speed:'100 Mbps', price:'$49', tag:'Most Popular',  color:'#0060ff' },
    { speed:'1 Gbps',   price:'$89', tag:'Business',      color:'#7c3aed' },
  ]},

  plans: { type: [planItem], default: [
    { name:'Starter',     speed:'50 Mbps',  price:29,  color:'#0070ff', features:['Unlimited data','2 devices','Email support'] },
    { name:'Home Plus',   speed:'100 Mbps', price:49,  color:'#00d4ff', hot:true, features:['Unlimited data','6 devices','24/7 support'] },
    { name:'Business',    speed:'500 Mbps', price:89,  color:'#a855f7', features:['Unlimited data','20 devices','Priority support','Static IP'] },
    { name:'Gigabit Pro', speed:'1 Gbps',   price:149, color:'#ff8c00', features:['Unlimited data','Unlimited devices','Dedicated support','2× Static IPs','SLA 99.9%'] },
  ]},

  contact: {
    phone:   { type: String, default: '' },
    email:   { type: String, default: '' },
    address: { type: String, default: '' },
    hours:   { type: String, default: '' },
  },

  sectionTitles: {
    plans:   { type: String, default: 'Choose Your Speed' },
    router:  { type: String, default: 'Enterprise-Grade Routing Core' },
    cables:  { type: String, default: 'Direct Ethernet Infrastructure' },
    media:   { type: String, default: 'Our Network in Action' },
  },

  media: { type: [mediaItem], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('LandingContent', s);
