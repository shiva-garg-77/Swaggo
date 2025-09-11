import mongoose from 'mongoose'
import Profile from './Models/FeedModels/Profile.js'
import { v4 as uuidv4 } from 'uuid'

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/swaggo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const testUsers = [
  {
    profileid: uuidv4(),
    username: 'alice_wonder',
    name: 'Alice Wonder',
    bio: 'Exploring the digital wonderland 🐰',
    isPrivate: false,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'bob_builder',
    name: 'Bob Builder',
    bio: 'Building amazing things every day 🔨',
    isPrivate: false,
    isVerified: true,
    profilePic: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'charlie_brown',
    name: 'Charlie Brown',
    bio: 'Good grief! Just living life 🥜',
    isPrivate: false,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/men/2.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'diana_prince',
    name: 'Diana Prince',
    bio: 'Truth, justice, and amazing photos ⚡',
    isPrivate: false,
    isVerified: true,
    profilePic: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'edward_cullen',
    name: 'Edward Cullen',
    bio: 'Forever young, forever mysterious 🦇',
    isPrivate: true,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/men/3.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'fiona_shrek',
    name: 'Fiona',
    bio: 'Princess by day, ogre by night 👑',
    isPrivate: false,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/women/3.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'george_washington',
    name: 'George Washington',
    bio: 'First president, first on social media 🇺🇸',
    isPrivate: false,
    isVerified: true,
    profilePic: 'https://randomuser.me/api/portraits/men/4.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'hermione_granger',
    name: 'Hermione Granger',
    bio: 'Books, magic, and friendship ✨📚',
    isPrivate: false,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/women/4.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'iron_man',
    name: 'Tony Stark',
    bio: 'Genius, billionaire, playboy, philanthropist 🤖',
    isPrivate: false,
    isVerified: true,
    profilePic: 'https://randomuser.me/api/portraits/men/5.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'jane_doe',
    name: 'Jane Doe',
    bio: 'Just your average superhero 🦸‍♀️',
    isPrivate: false,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/women/5.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'shiva_dev',
    name: 'Shiva Singh',
    bio: 'Developer and tech enthusiast 💻',
    isPrivate: false,
    isVerified: true,
    profilePic: 'https://randomuser.me/api/portraits/men/6.jpg'
  },
  {
    profileid: uuidv4(),
    username: 'shiva',
    name: 'Shiva Kumar',
    bio: 'Simple and creative mind ✨',
    isPrivate: false,
    isVerified: false,
    profilePic: 'https://randomuser.me/api/portraits/men/7.jpg'
  }
]

async function seedUsers() {
  try {
    console.log('🌱 Starting to seed users...')
    
    // Check if users already exist and only add new ones
    for (const userData of testUsers) {
      const existingUser = await Profile.findOne({ username: userData.username })
      
      if (!existingUser) {
        const newUser = new Profile(userData)
        await newUser.save()
        console.log(`✅ Created user: ${userData.username}`)
      } else {
        console.log(`⏭️ User already exists: ${userData.username}`)
      }
    }
    
    console.log('🎉 User seeding completed!')
    console.log('\n📋 Available test users:')
    testUsers.forEach(user => {
      console.log(`- ${user.username} (${user.name})${user.isVerified ? ' ✓' : ''}`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding users:', error)
  } finally {
    mongoose.connection.close()
  }
}

seedUsers()
