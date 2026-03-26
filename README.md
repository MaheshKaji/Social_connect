#SocialConnect is a full-stack social media web application built with Next.js . It allows users to create profiles,share image-based posts,interact with others through likes and comments, and follow oher users to curate a personalized feed.

Live Demo : https://social-connect-git-main-maheshs-projects-f961267c.vercel.app/

What I Used : 
Framework: Next.js (App Router) 
Styling: Tailwind CSS (kept it clean and minimal) 
Database: PostgreSQL via Supabase 
File Storage: Supabase Storage (separate buckets for user avatars and post images) 
Auth: Custom JWT-based authentication alongside Supabase

Features : 
Secure Auth: Full JWT-based login and registration flow. 
User Profiles: Users can customize their bios, upload avatars, and track their followers/following counts.
Post Creation: Share what's on your mind (up to 280 characters) and attach an image. 
Engagement: Like posts and leave comments. 
Follow System: Curate your own feed by following (or unfollowing) other users. 
The Feed: A smooth, paginated timeline pulling in the right posts.

Technical Decisions :
1.Supabase (Database and Storage): I intentionally split the storage into two separate public buckets: avatars and posts. I did this so that if I ever need to tweak security policies (RLS) or run cleanup scripts on old post images in the future, it won't accidentally break user profile pictures.

2.Tackling Next.js Hydration Errors While building the Feed and Navbar components, I ran into that classic React hydration mismatch. The server was trying to render the UI before it had access to the browser's local auth state. How I fixed it: I set the initial user state to null so the server and client renders would match perfectly right out of the gate. Then, I used a useEffect hook to safely grab the JWT/user data and update the UI strictly on the client side.

3.Building a Smart Feed (Global vs. Personalized) To handle the optional requirement of a personalized feed, I leaned on Supabase's relational querying. When a user loads their feed (/api/feed), the backend first checks the follows table to grab an array of the IDs they are following. I append the user's own ID to that list, and then use Supabase's .in() filter to fetch only the relevant posts. (If nobody is logged in, it just gracefully falls back to a global public feed).

4.Denormalizing Data for Speed I didn't want the app to run heavy, complex database joins just to count likes and comments every single time a post renders. To keep the feed loading incredibly fast, I denormalized the like_count and comment_count directly onto the posts table. When someone interacts with a post, the API routes just safely increment or decrement those integers directly.
