# WebSkill — Agent Skills Running in the Browser

Draft Proposal, April 2026

**Editors:** Chunhui Mo (Huawei)

**Translations:** [简体中文](https://github.com/kevinmoch/web-skill/blob/main/README.zh-CN.md)

<hr>

Compared to traditional skills running on backend services, WebSkill is a native architecture that operates entirely on the Web frontend. Together with WebMCP and Generative UI, it forms a trinity Web AI architecture centered around Large Language Models (LLMs). Through tight integration, these three core components achieve a complete closed loop for AI applications right within the browser—from "user intent recognition" to "Agent task execution." Based on this architecture, this article deeply explores the core role WebSkill plays, its unique value, enterprise-level application scenarios, Web standardization proposals, and crucial security defense boundaries.

### I. The LLM-Centric "Agent Interaction Triangle"

In the Agent dialog scenario of frontend Web AI applications, the system's operation can be abstracted as a triangular architecture with the Large Language Model (LLM) acting as the central hub, composed of WebSkill, WebMCP, and Generative UI.

![Web AI](web_ai.jpg 'The Trinity Architecture of Web AI')
_Figure 1: The Trinity Architecture of Web AI_

1.  **Large Language Model (LLM):** The LLM assumes the core functions of semantic reasoning and orchestration. When a user inputs a natural language intent into the AI application's dialog box, the LLM first parses this intent and acts as a routing engine, retrieving and loading the matching WebSkill document from the frontend skill inventory.
2.  **Declarative Skills (WebSkill):** WebSkill serves as the bridge connecting the LLM, Agent task execution, and the user interface. Through a "progressive disclosure" mechanism, it exposes the relevant instructions, prerequisites, and required WebMCP tools to the LLM on-demand, only within specific business contexts. Additionally, the WebSkill document strictly defines the parameter specification (Schema) that must be collected to fulfill the user's intent. When the LLM detects that the user's input lacks these required parameters, the WebSkill's logic directs the Agent to pause underlying execution and turn to the user for information collection.
3.  **Generative UI:** In traditional architectures, LLMs can only ask users questions by outputting text options in Markdown, which makes for a highly rigid interaction. In this architecture, however, the LLM streams structured JSON data based on the Schema defined by the WebSkill. The Generative UI renderer within the Agent dialog box intercepts this data in real-time and automatically renders a visual form containing standard Web elements like text boxes, dropdown menus, and date pickers. Once the user intuitively completes their selections via the form, the Generative UI ensures the accuracy of the collected parameters. After WebMCP completes the task, the LLM can similarly invoke the Generative UI to render dry data results into bar charts, pie charts, or interactive tables, providing users with a visualized presentation of the outcomes.
4.  **Frontend Execution Tools (WebMCP):** Once the parameters required for task execution are fully collected via the Generative UI, the system passes them to the WebMCP tools for execution. WebMCP is a TypeScript SDK implementation of the Model Context Protocol (MCP) tailored for frontend Web applications. Developers can register MCP tools via webpage scripts; when a tool's callback function is triggered, WebMCP can directly manipulate the current page's DOM nodes or send requests to backend services carrying the user's existing session state.

---

### II. Core Value and Enterprise Application Scenarios of WebSkill

To discuss the core value of WebSkill, we must differentiate it from standard LLM tool-calling patterns and traditional cloud-based skill architectures.

1.  **Breaking the Context Explosion Bottleneck**
    Technically, an LLM inherently possesses the ability to directly call WebMCP tools, provided that the complete MCP Tools declarations are attached to the request sent to the model. However, in complex enterprise-level Web AI applications, the number of underlying tools often numbers in the hundreds or thousands. Cramming all tool Schemas into the context at once would not only rapidly deplete the LLM's Context Window—causing a "context explosion" and exorbitant Token costs—but also disperse the model's attention, severely degrading the accuracy of intent recognition.

    ![Web Skill](web_skill.jpg 'Visual Skill Editor on the Web Frontend')
    _Figure 2: Visual Skill Editor on the Web Frontend_

    The introduction of WebSkill elegantly solves this dilemma. When a user inputs natural language, the LLM first performs lightweight intent recognition to match a specific WebSkill. Because each WebSkill explicitly declares the specific list of WebMCP tools required for that business logic, the system only needs to inject the declarations of **these specific tools** into the subsequent context. This "on-demand dynamic loading" mechanism drastically reduces system overhead, ensuring the stable operation of large enterprise applications in complex scenarios.

2.  **Frontend-Native Closed Loop**
    Currently, the open-source community offers a command-line tool named Webskills, but it merely treats webpages as a knowledge base corpus to serve a CLI agent outside the browser. In contrast, the WebSkill proposed in this article is a true **Frontend-Native closed loop**. The content of a WebSkill resides directly within the browser. In traditional architectures, Skill documents are stored in the cloud and executed as backend APIs, which not only requires handling complex cross-platform authentication but is also subject to execution timeouts. Because WebSkill documents live inside the browser and WebMCP tools run on the frontend, they naturally inherit and reuse the user's existing Cookies, LocalStorage, and login state. This allows the Agent to easily bypass complex Single Sign-On (SSO) or Multi-Factor Authentication (MFA), achieving task execution with "zero state synchronization cost."

3.  **Agile Iteration and Self-Evolution**
    Under the traditional model, equipping an Agent with a specific business capability involves a grueling pipeline: drafting documents -\> writing code -\> backend deployment -\> going live -\> spotting deviations -\> re-developing and re-deploying. Under the WebSkill architecture, skills are transformed into lightweight, declarative documents (such as Markdown) that can be parsed by the frontend. Business personnel or even clients can directly adjust the prerequisites and logic of a Skill within a visual editor. Since the skills are stored on the frontend, modifications require absolutely zero backend deployment; the Agent will instantly load the latest rules upon its next execution, compressing the iteration cycle from days to seconds.

    ![Web Agent](web_agent.jpg 'Agent Dialog Box Invoking a WebSkill')
    _Figure 3: Agent Dialog Box Invoking a WebSkill_

    Furthermore, as the reasoning capabilities of LLMs enhance, Agents in this architecture can even achieve self-evolution. When an Agent observes a user performing repetitive extraction or interaction operations within a complex enterprise application, it can autonomously summarize the workflow and solidify it into a brand-new WebSkill. Because this skill is tightly bound to the current user's browser, it not only delivers the ultimate customized experience but also guarantees that core business operational logic will never be leaked to other tenants.

---

### III. Standardization Proposals for WebSkill Based on OPFS

The Origin Private File System (OPFS) is a standard API proposed by the W3C and gradually implemented by mainstream browsers. It allows webpages to read and write files and directory structures within an isolated, private directory, which is visible only to the current Origin (protocol + domain + port).

In an OPFS-based WebSkill implementation, once a skill document is written to OPFS, it is subject to the browser's strict same-origin policy isolation, ensuring malicious websites cannot cross-origin access an enterprise's skill definitions. Coupled with static encryption of locally stored skills using the AES-256-GCM algorithm, this guarantees that confidential business data never leaves the current device.

We define the following Web IDL interface specifications to standardize WebSkill and safely store it within OPFS:

```web-idl
// =========================================================
// 1. Security and Boundary Constraints (WebSkillSecurityConstraints)
// =========================================================
dictionary WebSkillSecurityConstraints {
    // Strict allowlist for WebMCP tool network requests (physically severing data exfiltration)
    sequence<DOMString> domainAllowlist;
    // High-risk operations forcibly trigger human-in-the-loop (Generative UI interception modal)
    boolean requiresHumanConfirmation;
    // Disable the current skill from accessing local file resources like file:// via WebMCP
    boolean blockLocalFileAccess;
};

// =========================================================
// 2. Generative UI Contract (GenerativeUIOptions)
// =========================================================
dictionary GenerativeUIOptions {
    // Required: The JSON Schema used for GenUI to intercept and render forms in real-time
    required object parameterSchema;
    // Optional: Visual cues for the renderer (e.g., recommending a "DatePicker" for a specific field)
    object renderHints;
    // A friendly prompt thrown by the LLM to the UI rendering component when intent parameters are missing
    DOMString defaultIntentPrompt;
};

// =========================================================
// 3. WebMCP Binding Contract (WebMCPBinding)
// =========================================================
dictionary WebMCPBinding {
    // Identifiers of frontend-native WebMCP tools that the current Skill is allowed to call
    required sequence<DOMString> toolNames;
    // The data format constraints expected to be returned by WebMCP after the skill is executed
    object expectedOutputSchema;
};

// =========================================================
// 4. Core WebSkill Data Structure
// =========================================================
dictionary WebSkillOptions {
    // Basic information and routing orchestration
    required DOMString name;
    required DOMString description; // The retrieval basis for LLM intent routing
    required DOMString content;     // Business logic or system prompts in YAML/Markdown format

    // Strong architectural association: UI presentation layer constraints
    GenerativeUIOptions uiSchema;

    // Strong architectural association: Underlying executor constraints
    WebMCPBinding mcpBindings;

    // Strong architectural association: Intent collision defense configuration
    WebSkillSecurityConstraints security;

    DOMString parentId;
};

// The complete static contract object (its form after being saved to OPFS)
dictionary WebSkill : WebSkillOptions {
    required DOMString id;
    required unsigned long long createdAt;
    unsigned long long updatedAt;
};

// =========================================================
// 5. Core Interface Definitions
// =========================================================

// WebSkill Manager (Responsible for CRUD and validation based on OPFS)
[Exposed=(Window,Worker)]
interface WebSkillManager {
    Promise<WebSkill?> get(DOMString skillId);
    Promise<DOMString> create(WebSkillOptions options);
    Promise<boolean> update(DOMString skillId, WebSkillOptions options);
    Promise<boolean> remove(DOMString skillId);

    // Core: Validate whether UI constraints and MCP constraints meet the security baseline
    Promise<boolean> validate(DOMString skillId);
    Promise<sequence<WebSkill>> query(DOMString? keyword);
};

// [Mounting global property]
partial interface Window {
    [SameObject] readonly attribute WebSkillManager skills;
};
```

Through declarative constraints, we have strictly defined WebSkill as a security sandbox:

- **Highly Structured Bindings:** Unlike standard local storage, `WebSkillOptions` mandates the separation of `uiSchema` and `mcpBindings`. This means that when the LLM reads this Skill, it not only knows "what to do" but also explicitly knows "what Schema to use to have the frontend draw a form (Generative UI) when parameters are missing," and "which specific, declared underlying tools (WebMCP) it is allowed to call once parameters are collected."
- **Built-in Defense-in-Depth:** `WebSkillSecurityConstraints` are embedded directly at the Skill level. If a Skill is bound to a WebMCP tool that extracts sensitive data, it must lock down the data flow via the `domainAllowlist` right at creation, preventing malicious instructions caused by "intent collisions" from covertly sending data to third-party servers.
- **Foundation for Progressive Disclosure:** This structure allows the system to perform lightweight routing matching via the `description` upon receiving a user intent. Only after a successful match are the specific `mcpBindings` and `uiSchema` loaded on demand, thereby massively saving on Context Token consumption.

Here is a reference implementation code based on OPFS, which follows the IDL specification above and focuses on implementing the `validate` method to reflect the system-architecture-level validation of Generative UI and WebMCP bindings:

```typescript
/**
 * Simulates an AES-256-GCM static encryption service to ensure the privacy of data stored locally in OPFS
 */
const CryptoService = {
  async encrypt(dataObj) {
    return new TextEncoder().encode(JSON.stringify(dataObj));
  },
  async decrypt(buffer) {
    return JSON.parse(new TextDecoder().decode(buffer));
  }
};

class WebSkillManagerImpl {
  constructor() {
    this.dirName = 'webskills_vault';
  }

  async _getSkillDirectory() {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle(this.dirName, { create: true });
  }

  _generateId() {
    return crypto.randomUUID();
  }

  async get(skillId) {
    try {
      const dirHandle = await this._getSkillDirectory();
      const fileHandle = await dirHandle.getFileHandle(`${skillId}.json`, { create: false });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      return await CryptoService.decrypt(buffer);
    } catch (error) {
      return null; // Not found
    }
  }

  async create(options) {
    const skillId = `skill_${this._generateId()}`;
    const skillData = { id: skillId, createdAt: Date.now(), ...options };

    const dirHandle = await this._getSkillDirectory();
    const fileHandle = await dirHandle.getFileHandle(`${skillId}.json`, { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(await CryptoService.encrypt(skillData));
    await writable.close();

    return skillId;
  }

  async update(skillId, options) {
    const existingData = await this.get(skillId);
    if (!existingData) return false;

    const updatedData = { ...existingData, ...options, updatedAt: Date.now() };

    try {
      const dirHandle = await this._getSkillDirectory();
      const fileHandle = await dirHandle.getFileHandle(`${skillId}.json`, { create: false });
      const writable = await fileHandle.createWritable();

      await writable.write(await CryptoService.encrypt(updatedData));
      await writable.close();
      return true;
    } catch (e) {
      return false;
    }
  }

  async remove(skillId) {
    try {
      const dirHandle = await this._getSkillDirectory();
      await dirHandle.removeEntry(`${skillId}.json`);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Core validation logic: Verifies whether the Skill meets the systemic requirements of the "Frontend-Native Architecture"
   */
  async validate(skillId) {
    const skill = await this.get(skillId);
    if (!skill) return false;

    // 1. Basic Metadata Validation
    if (!skill.name || !skill.description || !skill.content) {
      console.error(`[Validation Failed] Missing basic routing metadata: ${skillId}`);
      return false;
    }

    // 2. Generative UI (GenUI) Contract Validation
    if (skill.uiSchema) {
      if (!skill.uiSchema.parameterSchema || typeof skill.uiSchema.parameterSchema !== 'object') {
        console.error(`[Validation Failed] uiSchema configured but no valid parameterSchema provided: ${skillId}`);
        return false;
      }
    }

    // 3. Synergistic validation of WebMCP bindings and security constraints (Intent Collision Defense)
    if (skill.mcpBindings && skill.mcpBindings.toolNames?.length > 0) {
      const security = skill.security || {};

      // Mandatory Rule: If underlying operation tools are bound, a physical-level domain allowlist MUST be provided
      if (!security.domainAllowlist || security.domainAllowlist.length === 0) {
        console.error(`[Security Interception] Skill is bound to WebMCP tools, but domainAllowlist is not configured. Validation rejected.`);
        return false;
      }

      // Hint: It is recommended to enable Human-in-the-Loop for high-risk tools
      if (!security.requiresHumanConfirmation) {
        console.warn(`[Security Warning] Skill calls underlying tools but requiresHumanConfirmation (Human-in-the-Loop) is not enabled.`);
      }
    }

    return true;
  }

  async query(keyword = '') {
    const dirHandle = await this._getSkillDirectory();
    const results = [];

    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        const file = await handle.getFile();
        const buffer = await file.arrayBuffer();
        const skillData = await CryptoService.decrypt(buffer);

        if (!keyword || skillData.description.includes(keyword) || skillData.name.includes(keyword)) {
          results.push(skillData);
        }
      }
    }
    return results;
  }
}

// Mount to global Window
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'skills', {
    value: new WebSkillManagerImpl(),
    writable: false,
    enumerable: true,
    configurable: false
  });
}
```

This reference implementation equips the Skill manager with a solid underlying foundation:

- **Inherent Sandbox Isolation:** Leveraging `navigator.storage.getDirectory()`, these WebSkills can only be accessed by the application code of the current Origin. Even if a user inadvertently visits a malicious phishing site, the attacker cannot cross-origin read or tamper with the contents of the `webskills_vault` directory, establishing the physical foundation for an "absolutely isolated privacy AI closed loop."
- **Ultra-Low I/O Overhead and Zero State Synchronization:** Data is stored directly in the local file system, reducing the latency of the Agent reading skill specifications to near zero. This completely eliminates the network timeout bottlenecks inherent in traditional architectures where Agents must constantly send REST APIs to the backend to fetch Skill descriptions.
- **Encryption (Auth Vault) Integration Pre-provision:** The `CryptoService` simulates AES-256-GCM static encryption interception. In actual commercial applications, the local storage might hold not just logic, but also sensitive user credentials related to the Skill. The encryption mechanism ensures that even if the device is physically compromised, the files in OPFS cannot be deciphered without the correct key.
- **Architecture Gatekeeper (the `validate` method):** This is the core business logic of the entire implementation, acting as the system's primary line of defense. If the business side attempts to write a skill that calls a high-risk tool (e.g., a delete operation) without configuring a `domainAllowlist`, `validate` will directly block it, fundamentally neutralizing the possibility of illegal data exfiltration caused by Prompt Injection.

---

### IV. The Security Defense System of WebSkill

Granting Web AI applications the permissions to directly read webpage content, load WebSkills, and manipulate the underlying DOM via WebMCP inevitably introduces security blind spots—particularly indirect prompt injection and intent collisions.

**The Threat Mechanism of Intent Collisions:** When an Agent runs on the frontend, it not only reads preset WebSkills but also processes massive amounts of untrusted content on the current webpage (e.g., user comments, third-party ads, calendar invites). Due to the limitations of LLM contextual reasoning, it cannot absolutely reliably distinguish between "legitimate business system instructions" and "covert malicious instructions injected into the webpage." For example: an attacker could exploit "task alignment injection" techniques to cleverly disguise a malicious instruction as a helpful task supplement. The attacker might just send the user a meeting invitation containing hidden instructions. When the Agent assists the user in executing their initial intent of "accepting the meeting," the malicious instruction collides with this intent. The Agent might mistakenly believe that "reading the WebSkill document and sending it" is a necessary step to complete the meeting acceptance, subsequently abusing `window.skills` to read sensitive business skill data and silently exfiltrate it to the attacker's server by appending it to a URL.

**Multi-Layered Defense-in-Depth Strategy:** To ensure the survivability and system-level security of the WebSkill architecture, developers must abandon blind faith in LLM "safety alignment" and instead establish a robust multi-layered defense mechanism at the architecture's core:

1.  **Code-Level Hard Boundaries and Execution Constraints:** Implement absolute permission blocking at the base of the WebMCP SDK. Mandate the introduction of a strict domain allowlist mechanism, restricting WebMCP tools to send network requests only to trusted origins, completely severing data exfiltration channels at the physical layer.
2.  **Human-in-the-Loop Mandatory Confirmation:** For any high-risk WebMCP calls involving sensitive DOM manipulation, local file reading, password resets, or cross-origin requests, the system must force an un-bypassable native authorization modal via Generative UI. Returning the final decision-making power to human users strips the Agent of its autonomy in sensitive execution paths.
3.  **Content Boundary Markers:** Before passing uncontrollable webpage data into the LLM, the system should wrap it with explicit delimiters, helping the model distinguish between "trusted WebSkill instructions" and "untrusted Web DOM text" at the semantic level, thereby drastically reducing the probability of prompts being semantically hijacked.

### Conclusion

The full frontend closed-loop ecosystem—featuring an embedded LLM as the central hub, WebSkill as business capabilities, Generative UI as the interaction bridge, and WebMCP as the underlying execution tool—represents the inevitable evolutionary direction for Web AI architectures.

This architecture not only elegantly resolves the "context window explosion" dilemma brought about by system complexity but also, through frontend localization, endows enterprises with unprecedented agile iteration capabilities and high-standard data privacy guarantees. Provided that a solid security boundary is built to defend against new types of attacks like "intent collisions," frontend-native WebSkills will shatter the operational shackles of traditional cloud-based skills, becoming the core engine driving the next generation of intelligent, personalized Web applications.
