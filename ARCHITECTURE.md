# Textpile: Architecture and Implications

**A plain-language explanation for non-technical users**

This document explains what Textpile is, how it works, what it means to run one, and what you're signing up for if you use or operate it.

---

## What is Textpile?

Textpile is a **temporary reading surface** for communities that want to share long-form text without the burden of permanent storage.

Think of it like:
- **A bulletin board** that automatically takes posts down after a while
- **A shared reading list** where everyone can add items, but they don't stay forever
- **A lightweight publishing tool** without accounts, profiles, or permanent archives

---

## Core Design Principles

### 1. Temporary by Design

**What this means:**
- Posts automatically delete themselves after a period you choose (1 week to 1 year)
- There is no "save forever" option
- The system doesn't keep backups
- Once something expires, it's truly gone

**Why this matters:**
- No one expects Textpile to be an archive
- You're not on the hook for preserving content forever
- Legal and ethical responsibility is lighter
- Storage costs stay low

**Implications for users:**
- **You must keep your own copies** of anything important
- Don't rely on Textpile as your only copy
- Save the Textpile URL along with your local copy for reference

### 2. Non-Attributed at the Artifact Layer

**What this means:**
- Textpile doesn't collect or store author names
- No login required, no user accounts
- No email addresses, no profiles
- Posts are just text and a timestamp

**Why this matters:**
- Simpler to operate (no user management)
- Lower privacy risk (no personal data stored)
- Encourages focus on content, not reputation
- Less liability for the operator

**Implications for users:**
- Keep attribution in your own records (email, notes, etc.)
- Include author/version info in the document itself if needed
- The community layer (email list, chat) maintains context

### 3. Low Maintenance by Design

**What this means:**
- No database to manage
- No background jobs to monitor
- No manual cleanup required
- Posts expire automatically via the storage system

**Why this matters:**
- Minimal time commitment to run
- Less likely to break or need emergency fixes
- Can run on free tier of Cloudflare

**Implications for operators:**
- If it becomes burdensome, you can shut it down without guilt
- Users know this is a "light touch" service
- Not suitable for mission-critical needs

---

## How It Actually Works

### The Technology (Simplified)

**Cloudflare Pages:**
- Like a web host, but free for most uses
- Automatically handles traffic spikes
- Built-in security and speed

**Cloudflare Functions:**
- Small programs that run when someone submits or views a post
- Only run when needed (not 24/7)
- Very cheap (usually free)

**Cloudflare KV (Key-Value Storage):**
- Like a filing cabinet for your posts
- Automatically deletes expired posts
- Pay only for what you use (usually free for small communities)

### What Happens When Someone Submits a Post

1. User writes text in the submit form
2. User picks how long it should last (1 week to 1 year)
3. Clicks "Publish"
4. Cloudflare Function receives the text
5. Stores it in KV with an auto-delete timer
6. Adds it to the table of contents
7. Returns a URL immediately

**Total time: Under 1 second**

### What Happens When a Post Expires

1. KV automatically deletes the post (no action needed from you)
2. Next time someone loads the homepage, expired posts are filtered out
3. If someone visits the old URL, they see "This post has expired"

**No cron jobs, no manual cleanup, no forgotten data**

---

## Costs and Sustainability

### Typical Costs

**Small community (10-50 active users):**
- 50-200 posts/month
- 1,000-5,000 page views/month
- **Cost: $0/month** (Cloudflare free tier)

**Medium community (50-200 users):**
- 200-1,000 posts/month
- 5,000-20,000 page views/month
- **Cost: $0-5/month** (usually still free)

**Large community (200+ users):**
- 1,000+ posts/month
- 20,000+ page views/month
- **Cost: $5-10/month** (paid Cloudflare tier)

**Most communities never leave the free tier.**

### When Costs Increase

You'll only pay if:
- More than 100,000 function calls per day (~3 million/month)
- More than 1,000 KV writes per day (~30,000/month)
- More than 1 GB of stored posts

**To stay free:**
- Use shorter retention periods (more auto-deletion)
- Limit posts per user if needed
- Use an add post password to prevent spam

### Hidden Costs (Your Time)

The real cost is your attention:

**Low burden (designed case):**
- 5-10 minutes/month to check for spam
- Occasional communication about expectations
- Maybe rotate tokens quarterly

**Higher burden (if something goes wrong):**
- Dealing with spam attacks
- Fielding requests to recover expired content
- Managing community expectations
- Troubleshooting issues

**Important**: If burden grows, you can shut down. This is by design, not failure.

---

## What Could Go Wrong

### Spam and Abuse

**Scenario**: Someone (or a bot) floods Textpile with junk posts.

**What happens**:
- Homepage fills with garbage
- Legitimate posts get buried
- Community frustrated

**Prevention**:
- Require a shared add post password (share with trusted users only)
- Enable Cloudflare rate limiting (10 posts/minute max)
- Use Cloudflare Access for authentication

**Recovery**:
- Delete spam posts via admin API
- Block submitter via IP
- Temporarily disable submissions
- Posts auto-expire anyway

**Worst case**: Shut down, wait for spam to expire, restart with token required.

### Legal Issues

**Scenario**: Someone posts illegal content, copyrighted material, or harmful content.

**Your responsibility**:
- You're hosting the platform, so you may have liability
- Depends on jurisdiction (US has Section 230 protections, Europe has different rules)
- Not legal advice, but awareness matters

**Protection measures**:
- Make it clear Textpile is temporary and non-archival
- Enable admin removal for quick takedown
- Consider Cloudflare Access for closed communities
- Document your policies

**Nuclear option**: Delete everything, shut down service.

### User Expectations

**Scenario**: User expects you to recover their expired post.

**What happens**:
- They didn't keep a copy
- They're upset it's gone
- They ask you to restore it

**Prevention**:
- Make retention policy VERY clear on submit page
- Warning text: "Posts expire. Keep your own copy!"
- Set cultural norm: authors are responsible for archiving

**Response**:
- Politely explain: Textpile doesn't keep backups (it's true!)
- Point to warnings on submit page
- Sympathize but don't take responsibility

### Technical Failures

**Scenario**: Cloudflare has an outage, or you misconfigure something.

**What happens**:
- Site is down
- Users can't submit or read
- Maybe data is lost (rare)

**Prevention**:
- Cloudflare is very reliable (99.99%+ uptime)
- Test configuration changes carefully
- Keep git repository backed up

**Recovery**:
- Wait for Cloudflare to fix outages (usually minutes)
- Restore from git if you broke something
- Communicate status to users

**Important**: Because posts are temporary, data loss is less catastrophic than with archives.

---

## Social and Ethical Implications

### You're Providing a Service, Not Making a Promise

**What Textpile is NOT:**
- Not a guaranteed service
- Not a permanent archive
- Not someone else's responsibility to back up
- Not something you must maintain forever

**What Textpile IS:**
- A temporary convenience
- A community utility
- Something you can stop offering
- A "gift" you can take back

**Set expectations clearly:**
> "I'm running this Textpile for now. If it becomes burdensome, I'll give you a few weeks notice and shut it down. Keep your own copies of everything."

### Power and Responsibility

**As the operator, you have power to:**
- See all posts (they're in your KV namespace)
- Delete any post immediately
- Shut down the whole service
- Control who can submit

**This means:**
- Users trust you not to abuse this
- You should be transparent about policies
- Consider if you want this responsibility

**If you're uncomfortable**: Don't run Textpile, or use Cloudflare Access to limit it to a closed group.

### Community Dynamics

**Textpile changes how communities share:**

**Positive effects:**
- Encourages "reading now" instead of "saving for later"
- Reduces clutter of old, outdated posts
- Lowers stakes (not permanent means less anxiety)
- Simple, focused tool

**Potential negative effects:**
- Important discussions might be lost
- Users might forget to save their own work
- Feels "less official" than a blog or wiki
- Some people uncomfortable with non-permanence

**Cultural fit:**
- Works well for: email lists, chat communities, study groups, working groups
- Works poorly for: knowledge bases, official documentation, legal records

---

## Decision Guide: Should You Run a Textpile?

### Good Fit If:

✅ Your community already coordinates via email or chat
✅ You want a lightweight way to share long-form content
✅ You're comfortable with temporary storage
✅ You can set boundaries ("I'll shut it down if it's annoying")
✅ Your users understand digital literacy (keep your own copies)
✅ You're okay with 5-10 minutes/month of maintenance

### Poor Fit If:

❌ You need permanent archives
❌ Users expect guaranteed uptime
❌ You can't tolerate any spam or abuse
❌ Content has legal/compliance requirements
❌ You want attribution, profiles, or social features
❌ You're uncomfortable being responsible for infrastructure

### Alternatives to Consider

**If you need permanence:**
- **GitHub Discussions** (free, permanent, searchable)
- **Discourse forum** (more features, more maintenance)
- **Wiki** (collaborative, permanent)

**If you want simplicity but permanence:**
- **Google Docs folder** (shared, simple, backed up)
- **Notion workspace** (structured, collaborative)

**If you want non-attribution:**
- **PrivateBin** (similar philosophy, single pastes)
- **Pastebin** (public, permanent, no guarantees)

**Textpile's niche**: Temporary, low-maintenance, community-focused, non-attributed.

---

## Operating Principles for Success

### 1. Set Clear Expectations

**On the homepage:**
- "Posts expire automatically"
- "No backups are kept"
- "This service may be discontinued at any time"

**With your community:**
- Explain what Textpile is and isn't
- Remind people to keep their own copies
- Make shutdown conditions clear

### 2. Communicate Proactively

**When you start:**
- Announce Textpile availability
- Share add post password (if using)
- Explain retention periods

**Ongoing:**
- Report any issues or downtime
- Notify about policy changes
- Give advance warning before shutdown (if possible)

### 3. Protect Yourself

**Technical:**
- Use add post password to prevent spam
- Enable rate limiting
- Use Cloudflare Access for closed groups
- Keep ADMIN_TOKEN secret

**Social:**
- Document your policies
- Don't promise more than you can deliver
- Be willing to say "no" to feature requests
- Shut down if burden grows

### 4. Respect User Agency

**Users are responsible for:**
- Keeping their own copies
- Respecting community norms
- Understanding retention policies

**You are responsible for:**
- Clear communication
- Reasonable uptime (best effort)
- Quick removal of problematic content
- Shutting down gracefully if needed

---

## Summary: What You're Signing Up For

### As an Operator:

**Time commitment:**
- **Setup**: 30-60 minutes (following INSTALLATION.md)
- **Ongoing**: 5-10 minutes/month (checking for spam)
- **Emergency**: 15-30 minutes if problems arise (rare)

**Financial commitment:**
- **Most likely**: $0/month (free tier)
- **Possibly**: $5/month (if community is large)

**Responsibility:**
- Provide best-effort service
- Remove problematic content if needed
- Communicate status and changes
- Shut down gracefully if you stop

**What you're NOT signing up for:**
- Guaranteed uptime
- Permanent archival
- Recovering expired content
- Endless feature development
- Legal liability (though consult a lawyer if concerned)

### As a User:

**What you get:**
- Simple, fast place to post long-form text
- No account required
- Automatic cleanup (posts expire)
- Easy sharing via URL

**What you must do:**
- Keep your own copies of everything important
- Respect retention periods (no recovery after expiration)
- Understand the service may be discontinued
- Follow community norms

**What you're NOT getting:**
- Permanent archival
- Guaranteed availability
- Author attribution at the platform level
- Advanced features (comments, editing, etc.)

---

## Final Thoughts

Textpile represents a **deliberate choice** to prioritize:
- Simplicity over features
- Temporariness over permanence
- Low maintenance over comprehensive service
- Community responsibility over platform responsibility

This isn't for everyone or every use case. But for the right community, it can be a refreshingly low-burden way to share writing.

**The key insight**: By designing for easy shutdown, Textpile makes it easier to say "yes" to starting in the first place.

---

## Questions to Ask Yourself

Before deploying Textpile, consider:

1. **Do I understand that posts will be deleted automatically?**
2. **Am I comfortable being responsible for infrastructure?**
3. **Can I shut this down if it becomes annoying?**
4. **Does my community understand this is temporary?**
5. **Am I willing to deal with occasional spam or abuse?**
6. **Can I give a few weeks notice before shutting down?**

If you answered "yes" to most of these, Textpile might be a good fit.

If you're uncertain, start with a small trial (1-2 months) and see how it goes.

---

**Remember**: Running a Textpile is an experiment in low-burden community infrastructure. It's okay to try it, and it's okay to stop.
