# UCM - Transcript  
  
# UCM - Transcript  
  
## Summary  
### Flow Summary  
Working session framing UCM's core problem: fragmented patient engagement across Salesforce and Epic drives high ED readmissions. Team agreed to research evidence-based solutions and prototype a unified triage view.  
  
### Problem Framing  
- UCM sees excess ED admissions; ED patients nearly always readmit to UCM  
- Patient engagement strategy fragmented: ops/MyChart/Epic vs marketing (Marketing Cloud, SMS, web, Agentforce)  
- No single owner consolidating data across work groups; progress stalled  
  
### Tech & Workflow Constraints  
- Salesforce vs Epic 'death match'; sync issues hurt Health Cloud adoption in access team  
- Info entered in Epic (clinicians in ED), but problem-solvers work in Salesforce  
    - Solution must live in existing workflows, not a new tool  
- Unionized nurses/social workers likely to resist AI taking over job parts  
  
### Desired Demo Outcome  
- Show art-of-the-possible: clear intent delineation across systems plus example patient journey reducing readmissions  
- Single actionable view triaging patients low/medium/high risk with next best actions, using existing data  
    - CMO likes flashy, innovative, detail-focused; strong internal sway  
- Agentforce already in flight for FAQ/scheduling deflection; readmission use case being pulled up  
  
### Next Steps  
- (Speaker 1) Jess and David to research evidence-based methods for reducing 30-day readmissions  
- (Speaker 1) Dig up existing Agentforce readmission use cases to share  
  
### Decisions Made  
- Demo will focus on art-of-the-possible unified patient view, not solving the Salesforce/Epic integration  
- Target the readmission problem as the headline UCM problem statement for this session  
  
## Transcript  
[00:00] Speaker 1: Are different work streams at different points. Right now we're doing marketing cloud, we're doing an agent force project, and a website redesign project, but in each of those we're initiating within the marketing team. Within each of those projects, but we touch the operational team significantly, and what we observe is that there's tons of data available across these different UCM systems.  
[00:24] Speaker 1:  But the work groups that are responsible for trying to reduce 30-day readmissions are segmented into too many different work groups. There is no unifying body that's cohesively defining a strategy, and so progress is significantly hindered because there is no single source of truth consolidating that information.  
[00:53] Speaker 1:  So that's the biggest thing. I think the main, the simplest problem statement here is that UCM gets too many ED admissions, and when a patient is admitted to the ED, they're almost guaranteed to get readmitted to UCM.  
[01:13] Speaker 1:  And so the things that we've been thinking about are: how can we be better at proactively identifying those patient populations to better message to those individuals? How can we coordinate better with those work groups to socialize what we're observing and try and make that actionable in the operations space?  
[01:34] Speaker 1:  But today we only have significant influence in the marketing space and can't really go down as far as we need to to make that intended impact. Today there is no cohesive single strategy on patient engagement and communication.  
[01:57] Speaker 1:  It's fragmented across operations, within MyChart and Epic, and the access center. Then you have marketing with the website, marketing cloud emails, SMS communication, and agent force, which is on the website but kind of blends into operations because the main goal is to deflect call volume from the access center.  
[02:26] Speaker 1:  And then you have also Epic and CloWorld functionality, where we have the competing "death match," as they quote it, between Salesforce and Epic in terms of who is going to be engaging the patient or which types of goals and transactions it impacts.  
[02:49] Speaker 1:  So I'll pause there for a second.  
[02:56] Speaker 1:  That's the highest level. Any questions?  
[03:00] Speaker 1:  Jess knows plenty about that. I just want to—I want to comment, one, I know UCM really well.  
[03:04] Speaker 1:  Two, I know how care well too. Everyone can tell you, "This is not a UCM-only issue.  
[03:09] Speaker 1:  This is an across-the-entire nation issue." So David, I want you and I to go do some digging on what are the best, actually evidence-based methods to solve this.  
[03:19] Speaker 1:  And based on how we know UChicago, they desperately need to be bringing data together. This seems like a problem that no one wants to own, and so if we can help shine a light on it, I'm assuming that's our big problem statement today, is how can we make this feel more tangible to solve.  
[03:36] Speaker 1:  Yes. I love that, Jess.  
[03:37] Speaker 1:  Yeah. When I heard the opportunity for this session, my goal was like, "Hey, what's the biggest problem UCM faces?"  
[03:43] Speaker 1:  and this was it. So with love, exactly that conversation of, "How can I help make this more tangible and achievable?"  
[03:52] Speaker 1:  So love that. Is there a technology that has an edge in terms of what an ideal solution would look like?  
[04:08] Speaker 1:  It will need to be something that can live within their existing workflows. If we try to create something too fancy and out there, they're not going to use it.  
[04:19] Speaker 1:  I honestly don't know. I know the marketing team uses Adobe Analytics and whatnot, but what is Philip using?  
[04:26] Speaker 1:  To me, this is an access issue. Agreed.  
[04:29] Speaker 1:  Sorry, can you say who Philip is? Tyler using, yeah.  
[04:32] Speaker 1:  The Chief Operations Officer. Gotcha.  
[04:36] Speaker 1:  So yeah, their technology stack is primarily Salesforce. They have Health Cloud, Marketing Cloud, Data Cloud, and their access team leverages Health Cloud, but there's been some adoption issues because of the sync issues between Epic and Salesforce.  
[05:01] Speaker 1:  And so I think that's a primary point of friction in the death match of those two entities.  
[05:10] Speaker 1:  I'm not sure if that answered your question. But in this environment, it's well known that Salesforce and Epic do not want to play nice together with one another, and that's a huge, huge, huge issue in this area.  
[05:20] Speaker 1:  Neither of those—so if I play some of that—it sounds like neither of those can go away, but there needs to be some orchestration layer that could rectify and appease the death match to some extent.  
[05:36] Speaker 1:  I think that's absolutely right. Okay.  
[05:43] Speaker 1:  Other questions? So for today, if we could show you something at the end of the day, what would get them excited?  
[05:53] Speaker 1:  What would get them stoked? If they could just see something that could show the potential, even if it can't solve the entire integrations problem in a day, what is sort of that end product that might get them excited to say, "Okay, I see that they can actually think about this, and this might be a partner that we want to work with"?  
[06:12] Speaker 1:  I think it would be something where it's clear delineation of intent across the different systems to engage the patient, and then an example patient journey where those systems act in harmony to drive reducing readmissions.  
[06:34] Speaker 1:  I think your answer in the brief is really perfect, but it's like, if we just even want to read it for the recording, or if we can just put it in the recording. We'll use both.  
[06:45] Speaker 1:  If you can scroll up, Nick. It was the, "What would a good experience look like?"  
[06:52] Speaker 1:  It is flagging a single actionable view. I think also for me, if we're thinking about clinicians, social workers, everyone, especially in the ED, it needs to be something that they're not collecting more information, it's just bringing together the information that they already have into a way that can probably triage people into low risk of readmission, medium risk of readmission, and high risk of readmission, and then helping understand exactly what are the recommended next best actions there.  
[07:23] Speaker 1:  And then UChicago is such a fascinating place that they'd probably need like 100 more social workers on staff just to manage this. But that's not our job.  
[07:36] Speaker 1:  It's our job to just show who would you focus your efforts on to not be readmitted. Have there been—oh, sorry.  
[07:45] Speaker 1:  I'm sorry. Ask a question.  
[07:47] Speaker 1:  So if you were putting this into their workflows, right, and you mentioned a couple of names, you probably can't solve across the board, but if you were to give one organization that's looking at this, looking at it, are they going out of Salesforce or Epic or something else? I think it's Salesforce.  
[08:06] Speaker 1:  But the information is being—I think the information is being entered in Epic by your doctors and your nurses in your ED. Correct.  
[08:13] Speaker 1:  But the people who are looking at it to try to solve it are looking at Salesforce. In Salesforce, right?  
[08:19] Speaker 1:  Correct. Okay.  
[08:21] Speaker 1:  But UCM has access to both, right? But that's exactly the issue.  
[08:26] Speaker 1:  And then bringing—yeah. Which user bases prefer which input?  
[08:30] Speaker 1:  Exactly. Yeah.  
[08:31] Speaker 1:  In Salesforce. The goal of this isn't necessarily to solve for the death match.  
[08:35] Speaker 1:  The goal of this is to show art of the possible of—we know that there's these constraints. Both of these applications are going to exist.  
[08:41] Speaker 1:  Let's show art of the possible. If we could break down some of those barriers, what does that experience look like?  
[08:47] Speaker 1:  Correct? Yeah.  
[08:49] Speaker 1:  I was just thinking if you had to put it into an existing workflow, what are they using? Which sounds— It was a really good question.  
[08:56] Speaker 1:  We had to hit on that. Yeah.  
[08:57] Speaker 1:  People are entering information into one system, but the people trying to address the issue were in a different system. Correct.  
[09:02] Speaker 1:  Jess, you said something about a gap in the workforce. Can you say that again?  
[09:07] Speaker 1:  I also want to be—I'm incredibly biased. I am technically a social worker, so in my view, this is a problem that needs to be solved by end-to-end care.  
[09:18] Speaker 1:  So this is nearly getting into the solve, but they don't even know necessarily where to spend their time because there's always—we know across the country there's shortages of both nurses and social workers, so there is an issue. People are falling through the cracks from— Yeah.  
[09:36] Speaker 1:  For example. Salesforce perspective as well as from a data perspective.  
[09:39] Speaker 1:  For example, we've observed the struggle of one individual work group for post-discharge communications, which is a team of nurses dedicated to calling high-risk patients after they get discharged so they don't get readmitted to the ED. Even that, operationally, is difficult for them.  
[09:59] Speaker 1:  And John, just picking me on the side, let's also remember there's only so much UChicago can do. Also, zoom out.  
[10:05] Speaker 1:  UChicago exists within a part of Chicago that is historically overlooked and not supported in ways it could or should be from a wide variety of systems in the US. So this isn't just a UChicago issue to solve, but they often get the negative press of people wanting to try to solve it.  
[10:27] Speaker 1:  Yeah. One of the reasons I was asking is I'm curious if there have been any discussions about agentic workflows, managing and curating certain job parts as a means of solving some of the capacity issues.  
[10:45] Speaker 1:  Yes. Agent force is what they're trying to plug that hole with, and the goal is to deflect call volume from the access center employees because they only have a finite amount of those that are within a union, so it's difficult to manage those employees.  
[11:05] Speaker 1:  But the goals are we're prioritizing use cases first, FAQ, and then scheduling. So canceling, rescheduling, and now scheduling.  
[11:15] Speaker 1:  But that's more— Patients. It is all—it's in a different persona mind.  
[11:21] Speaker 1:  But yeah, so they're absolutely doing that. And I think you're trying to understand, could we use agentic workflows to offload some of the work to help this group?  
[11:30] Speaker 1:  Yeah. It sounds like agent force has a solve for some pieces of that: call volume, remediation, scheduling.  
[11:41] Speaker 1:  Those seem like—yeah, yeah. There are use cases for readmission that I think you know this.  
[11:47] Speaker 1:  It's being pulled up, and we're going to start working on an agent force use case exactly about this. I don't completely know what the solve is, but.  
[11:55] Speaker 1:  Okay. Cool.  
[11:56] Speaker 1:  Let's also remember, especially this is a heavily unionized environment. Your social workers and nurses are going to push back pretty hard from having parts of their job turned over to AI.  
[12:06] Speaker 1:  Doesn't mean we shouldn't play and have fun with it, but. But operationally.  
[12:10] Speaker 1:  Well, I think that, yeah. Figure something out so you can just get the data to them, right?  
[12:15] Speaker 1:  It's almost like you have to figure out what is that small piece that you can tackle today to show them. And it's the piece that everyone keeps passing around because this is a big issue.  
[12:25] Speaker 1:  No one wants to be in charge of trying to solve this because it's really, really, really hard to solve. Yeah.  
[12:30] Speaker 1:  Okay.  
[12:34] Speaker 1:  I love this. This is so fun.  
[12:36] Speaker 1:  Thank you for doing this. We feel good on UCM?  
[12:43] Speaker 1:  Yeah. Any other context for UCM that we want to add, or?  
[12:48] Speaker 1:  I don't think so. Great.  
[12:50] Speaker 1:  Jess, maybe I should dig up those use cases that we have. I would dig up the use cases.  
[12:53] Speaker 1:  And also, we do have a really close relationship with their CMO, and their CMO likes flashy. He likes innovative.  
[13:01] Speaker 1:  He likes detail-focused things. He's not the one solving this, but he does have a lot of sway within the organization.  
[13:09] Speaker 1:  So if we can't bring him something like that, we could get him really excited. And he loves solving.  
[13:16] Speaker 1:  100%. He's very good at selling to his executive leadership vision, so thank you.  
[13:23] Speaker 1:  Cool. Great.  
[13:25] Speaker 1:  Thank you so much.  
