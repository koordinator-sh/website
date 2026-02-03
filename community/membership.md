---
sidebar_label: Membership
sidebar_position: 2
---
# Membership

This doc outlines the various responsibilities of contributor roles in Koordinator.
It gives a brief overview of the community roles with the requirements and responsibilities associated with them.

<div>
  <img src="/img/membership.png" title="membership"/>
</div>

*Note that we don't set the reviewer role in Koordinator,
since we expect every community member to be a reviewer that could review the PRs he/she insterested in.*

## New contributors

[New contributors](https://github.com/koordinator-sh/koordinator/blob/main/CONTRIBUTING.md) should be welcomed to the community by existing members,
helped with PR workflow, and directed to relevant documentation and communication channels.

## Member(Committer)

Members are continuously active contributors in the community. They can have issues and PRs assigned to them, participate in subprojects,
and pre-submit tests are automatically run for their PRs. Members are expected to remain active contributors to the community.

**Defined by:** Member of the Koordinator GitHub organization

### Requirements

- Have made multiple contributions to the project or community.  Contribution may include, but is not limited to:
    - Authoring or reviewing PRs on GitHub. At least one PR must be **merged**.
    - Filing or commenting on issues on GitHub
    - Contributing to subproject or community discussions (e.g. meetings, Slack, email discussion
      forums, Stack Overflow)
- Have read the [contributor guide]
- Actively contributing to 1 or more subprojects
- Sponsored by 2 approvers/maintainers. **Note the following requirements for sponsors**:
    - Sponsors must have close interactions with the prospective member - e.g. code/design/proposal review, coordinating
      on issues, etc.
- **[Open an issue][membership request] against the koordinator-sh/community repo**
   - Ensure your sponsors are @mentioned on the issue
   - Complete every item on the checklist ([preview the current version of the template][membership template])
   - Make sure that the list of contributions included is representative of your work on the project.
- Have your sponsoring reviewers reply confirmation of sponsorship: `+1`
- Once your sponsors have responded, your request will be reviewed by the Koordinator maintainers. Any missing information will be requested.

### Responsibilities and privileges

- Responsive to issues and PRs assigned to them
- Responsive to mentions of the areas they are members of
- Active owner of code they have contributed (unless ownership is explicitly transferred)
  - Code is well tested
  - Tests consistently pass
  - Addresses bugs or issues discovered after code is accepted
- Members can do `/lgtm` on open PRs.
- They can be assigned to issues and PRs, and people can ask members for reviews with a `/cc @username`.

**Note:** members who frequently contribute code are expected to proactively
perform code reviews and work towards becoming a primary *approver* for the
subproject that they are active in.

## Approver(Subproject Owner)

Code approvers are able to both review and approve code contributions.  While
code review is focused on code quality and correctness, approval is focused on
holistic acceptance of a contribution including: backwards / forwards
compatibility, adhering to API and flag conventions, subtle performance and
correctness issues, interactions with other parts of the system, etc.

**Defined by:** *approvers* entry in an OWNERS file in a repo owned by the Koordinator project.

Approver status is scoped to a part of the codebase.

### Requirements

- Member for at least 3 months
- Primary reviewer for at least 10 substantial PRs to the codebase
- Reviewed or merged at least 30 PRs to the codebase
- Nominated by a maintainer
  - With no objections from other maintainers
  - Done through PR to update the top-level OWNERS file

### Responsibilities and privileges

The following apply to the part of codebase for which one would be a reviewer in
an [OWNERS] file (for repos using the bot).

- Approver status may be a precondition to accepting large code contributions
- Demonstrate sound technical judgement
- Responsible for project quality control via [code reviews]
- Expected to be responsive to review requests as per [community expectations]
- Mentor contributors and members
- May approve code contributions for acceptance

## Maintainer

Maintainers are in charge of the whole community to make sure the community work as expected,
which means they mainly focus on the community health rather than pushing features getting merged.

### Requirements

- Deep understanding of the technical goals and direction of the community
- Sustained contributions to design and direction by doing all of:
  - Authoring and reviewing proposals
  - Initiating, contributing and resolving discussions (emails, GitHub issues, meetings)
  - Identifying subtle or complex issues in designs and implementation PRs

### Responsibilities and privileges

- Make and approve technical design decisions for the community
- Define milestones and releases.
- Mentor and guide approvers, members, and contributors to the community
- Ensure continued health of community
  - Adequate test coverage to confidently release
  - Tests are passing reliably (i.e. not flaky) and are fixed when they fail
- Ensure a healthy process for discussion and decision making is in place
- Work with other maintainers to maintain the community's overall health and success holistically

## Steering Committee

Steering Committee is named sets of people that are chartered to take on sensitive topics.
This group is encouraged to be as open as possible while achieving its mission but,
because of the nature of the topics discussed, private communications are allowed.
