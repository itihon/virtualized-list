- [ ] make separate fixtures for manual and auto tests 

# Refactor 

<!--   - [ ] Move out the repetetive part of range utilities (normalization).
  - [ ] Use margin-top instead of top -->

  - [ ] Try to keep one instance of document fragment and itemsToRemove array between scroll events to ease garbage collection load.
  - [ ] change some methods of ScrollableContainer to getters and setters.

# Bugs

- [ ] Firefox sometimes doesn't render on page load
- [ ] DynamicListLayout infinite loop on resize
- [ ] DynamicListLayout 26th element gap

# Problems

- [ ] Layout switching, event bus detaching in ScrollableContainer, renderer, layout manager. It is probably needed to implement a method like unmount() or dispose() on ScrollableConainer and DOMConstructor, that unmounts DOM elements and detaches events.

- [ ] rendering sticky items

# Tests 

- [ ] Scroll direction change for fast, slow, fast -> slow, slow -> fast scrolling
- [ ] Initial rendering
- [ ] Resize

# Docs site

## Use cases

Each use case should demonstrate the following capabilities: 
- Resize
- Insertion/deletion at an arbitrary index
- Items height change (FixedListLayout)
- window scroller

### FixedListLayout

- Fixed list of items (with/without margins)
- Code rendering
- Contact list with sticky items

### DynamicListLayout

- List of articles with unknown item height
- Table with rows of unknown height
- Chat messages
- Infinite scroll
- Scroll at an arbitrary position of a lazy loaded items list with loading only visible items