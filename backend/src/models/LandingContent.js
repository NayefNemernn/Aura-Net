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

// Packages + cameras as shown/edited on the site (the editor and public
// sections both use these keys; default [] so the UI falls back to its built-ins).
const packageItem = new mongoose.Schema({
  tier:       { type: String, default: '' },
  name:       { type: String, default: '' },
  speed:      { type: String, default: '' },
  price:      { type: String, default: '' },
  routerName: { type: String, default: '' },
  popular:    { type: Boolean, default: false },
  features:   [String],
}, { _id: false });

const cameraSpec = new mongoose.Schema({
  label: { type: String, default: '' },
  value: { type: String, default: '' },
}, { _id: false });

const cameraItem = new mongoose.Schema({
  name:       { type: String, default: '' },
  model:      { type: String, default: '' },
  type:       { type: String, default: '' },
  resolution: { type: String, default: '' },
  cable:      { type: String, default: '' },
  connector:  { type: String, default: '' },
  image:      { type: String, default: '' },
  specs:      { type: [cameraSpec], default: [] },
  features:   [String],
}, { _id: false });

const s = new mongoose.Schema({
  _key: { type: String, default: 'main', unique: true },

  hero: {
    badge:    { type: String, default: 'Internet & Surveillance' },
    title1:   { type: String, default: 'Internet &' },
    title2:   { type: String, default: 'cameras,' },
    title3:   { type: String, default: 'installed\nproperly.' },
    subtitle: { type: String, default: 'We build quiet, reliable networks — fiber routers, HD cameras, Wi‑Fi coverage and UPS backup — for people who notice the details.' },
    cta1:     { type: String, default: 'View Packages' },
    cta2:     { type: String, default: 'Security Systems' },
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
    packages: { type: String, default: 'Choose Your Bandwidth' },
    cameras:  { type: String, default: 'The Sentinel View' },
    hardware: { type: String, default: 'The Hard Iron' },
    contact:  { type: String, default: 'Start Your Deployment' },
    media:    { type: String, default: 'Our Network in Action' },
  },

  media: { type: [mediaItem], default: [] },

  // Site packages + cameras (edited in the Website editor)
  packages: { type: [packageItem], default: [] },
  cameras:  { type: [cameraItem],  default: [] },

  // Pop-up ad shown to visitors when they open the public site
  ad: {
    enabled:   { type: Boolean, default: false },
    title:     { type: String, default: '' },
    body:      { type: String, default: '' },
    imageUrl:  { type: String, default: '' },
    linkUrl:   { type: String, default: '' },
    ctaLabel:  { type: String, default: '' },
    updatedAt: { type: Date },
  },
}, { timestamps: true });

module.exports = mongoose.model('LandingContent', s);
