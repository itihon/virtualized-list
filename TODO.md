- [ ] make separate fixtures for manual and auto tests 

# Refactor 

<!--   - [ ] Move out the repetetive part of range utilities (normalization).
  - [ ] Use margin-top instead of top -->

  - [ ] Try to keep one instance of document fragment and itemsToRemove array between scroll events to ease garbage collection load.
  - [ ] change some methods of ScrollableContainer to getters and setters.
  - [ ] ScrollableContainer: Since there is the method getItems(), having getFirstItem() and getLastItem() is probably pointless.
  - [ ] Add "pointer-events: none" to all items, content layer and scroll canvas on scroll start, and remove on scroll end for performance boost.
  - [ ] Optimaze store for DynamicListLayout: 

  ```ts
    // Minimal interface sufficient for DynamicListLayout, basically it's just a Map
    export interface IItemStore<ItemType extends StoredItem = unknown> {
      insertAt: (index: number, item: ItemType) => void; 
      deleteAt: (index: number) => void;
      getByIndex: (index: number) => MeasuredItem<ItemType> | undefined;
      readonly size: number;
    }
  ```

# Bugs

- [x] Firefox sometimes doesn't render on page load
- [ ] DynamicListLayout infinite loop on resize
- [x] DynamicListLayout 26th element gap
- [ ] Layout shift when wheel and scrollbar scroll changes perioadically.

# Problems

- [ ] Layout switching, event bus detaching in ScrollableContainer, renderer, layout manager. It is probably needed to implement a method like unmount() or dispose() on ScrollableConainer and DOMConstructor, that unmounts DOM elements and detaches events.

- [ ] rendering sticky items
- [ ] selected items support

# Tests 

- [ ] Scroll direction change for fast, slow, fast -> slow, slow -> fast scrolling
- [ ] Initial rendering
- [ ] Resize
- [ ] Layout shift when wheel and scrollbar scroll changes perioadically.
- [ ] Layout shift after jumping down, then up, then scrolling up when extra space is added.

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


---------------------------------------------------

- [x] 1. Preserve all necessary geometric properties for forced-reflow-safe later use.
- [x] 2. Prevent layout shift in Firefox.
- [x] 3. Loop over the rendered items.
- [x] 4. During the loop, get items that left overscan area to remove them, calculate removed height.
- [x] 5. During the loop, find scroll anchor item for scroll thumb adjustment. (What if it hasn't been found???).
- [x] 6. During the loop, accumulate min and max item height for calculating the index range to be rendered.
<!-- - [x] 7. Once the loop is finished, calculate index range to be rendered. 
- [x] 8. Subtract the calculated index range from the rendered range in order to render the items that are not yet rendered.
- [x] 9. Append/prepend (depending on scroll direction) the remained after the range subtraction items. -->
- [x] 7. Once the loop is finished, if bottom spacer top coordinate or top spacer bottom coordinate passed the opposite edge of the viewport (fast scroll), remove all items, calculate a new items range and render. Otherwise (slow scroll), render from the first/last rendered index (depending on scroll direction) up to the corresponding overscan edge. Remove the items that left overscan area accumulated during the loop.
- [x] 10. Set the spacer at the item insertion side (depending on scroll direction) to auto.
- [x] 11. Set the spacer at the item removal side to the removed height if scrolling is slow, otherwise set it to scroll viewport offset top/bottom -/+ overscan height (depending on scroll direction).
12. Once range index to be rendered is calculated: If the first/last item (depending on scroll direction) is not in the range and available scroll canvas height is less than the spare height, grow scroll canvas.
13. Once range index to be rendered is calculated: If the first/last item (depending on scroll direction) is in the range, cut scroll canvas.
14. Adjust scroll thumb if scroll anchor item was found on step 5, otherwise ???