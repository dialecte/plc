---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: PLC Dialecte
  text: IEC 61131-10, fully typed.
  tagline: Query, mutate, and manage PLCopen XML files with a type-safe Document API — 66+ element types, zero guesswork.
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/introduction/getting-started
    - theme: alt
      text: Why PLC Dialecte?
      link: /guide/introduction/what-is-plc-dialecte

features:
  - icon: ⚡
    title: 66+ Element Types
    details: Every PLCopen element — from Project to FunctionBlock — is fully typed. Attributes, children, and parent relationships are all compiler-checked.
  - icon: 📄
    title: Document / Query / Transaction
    details: Read with doc.query, write inside doc.transaction(). Changes are staged and committed atomically — no partial writes.
  - icon: 🧩
    title: IEC 61131-10 Ed1.0
    details: First-class support for the PLCopen XML exchange format. Typed access to PLC programs, function blocks, configurations, and data types.
---
