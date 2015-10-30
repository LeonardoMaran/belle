import React, {Component, PropTypes} from 'react';
import {injectStyles, removeAllStyles} from '../utils/inject-style';
import unionClassNames from '../utils/union-class-names';
import {has, map, shift, reverse, omit} from '../utils/helpers';
import {
  convertDateToDateKey,
  getDateKey,
  getWeekArrayForMonth,
  getLastDayForMonth,
  getLocaleData,
  CURRENT_DATE,
  CURRENT_MONTH,
  CURRENT_YEAR
} from '../utils/date-helpers';
import defaultStyle from '../style/date-picker';
import config from '../config/datePicker';
import ActionArea from './ActionArea';

/**
 * Returns an object with properties that are relevant for the wrapping div of the date picker.
 */
function sanitizeWrapperProps(properties) {
  return omit(properties, [
    'ref',
    'tabIndex',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onMouseDown',
    'onTouchCancel',
    'onMouseUp',
    'onTouchStart',
    'onTouchEnd',
    'disabled',
    'style',
    'className',
  ]);
}

/**
 * Returns an object with properties that are relevant for day span.
 */
function sanitizeDayProps(properties) {
  return omit(properties, [
    'tabIndex',
    'key',
    'ref',
    'onMouseDown',
    'onMouseUp',
    'onMouseOver',
    'onMouseOut',
    'onTouchStart',
    'onTouchEnd',
    'onTouchCancel',
    'style',
    'className',
  ]);
}

/**
 * Injects pseudo classes for styles into the DOM.
 */
function updatePseudoClassStyle(pseudoStyleIds, properties, preventFocusStyleForTouchAndClick) {
  const styles = [
    {
      id: pseudoStyleIds.prevMonthNavStyleId,
      style: {
        ...defaultStyle.hoverPrevMonthNavStyle,
        ...properties.hoverPrevMonthNavStyle,
      },
      pseudoClass: 'hover',

    }, {
      id: pseudoStyleIds.nextMonthNavStyleId,
      style: {
        ...defaultStyle.hoverNextMonthNavStyle,
        ...properties.hoverNextMonthNavStyle,
      },
      pseudoClass: 'hover',
    },
  ];
  let focusStyle;
  if (preventFocusStyleForTouchAndClick) {
    focusStyle = { outline: 0 };
  } else {
    focusStyle = {
      ...defaultStyle.focusStyle,
      ...properties.focusStyle,
    };
  }

  styles.push({
    id: pseudoStyleIds.styleId,
    style: focusStyle,
    pseudoClass: 'focus',
  });
  injectStyles(styles);
}

/**
 * DatePicker React Component.
 *
 * This implementation follows the recommendations proposed here:
 * http://www.w3.org/TR/wai-aria-practices/#datepicker
 */
export default class DatePicker extends Component {

  constructor(properties) {
    super(properties);
    let selectedDate;

    if (has(properties, 'valueLink')) {
      selectedDate = properties.valueLink.value;
    } else if (has(properties, 'value')) {
      selectedDate = properties.value;
    } else if (has(properties, 'defaultValue')) {
      selectedDate = properties.defaultValue;
    }

    this.state = {
      isFocused: false,
      isActive: false,
      selectedDate: selectedDate,
      month: properties.month - 1,
      year: properties.year,
    };

    this.localeData = getLocaleData(properties.locale);
    this.wrapperProps = sanitizeWrapperProps(properties.wrapperProps);
    this.dayProps = sanitizeDayProps(properties.dayProps);
    this.preventFocusStyleForTouchAndClick = has(properties, 'preventFocusStyleForTouchAndClick') ? properties.preventFocusStyleForTouchAndClick : config.preventFocusStyleForTouchAndClick;
  }

  static displayName = 'DatePicker';

  static propTypes = {
    // value related props
    defaultValue: PropTypes.instanceOf(Date),
    value: PropTypes.instanceOf(Date),
    valueLink: PropTypes.shape({
      value: PropTypes.instanceOf(Date),
      requestChange: PropTypes.func.isRequired,
    }),

    // component config related props
    locale: PropTypes.string,
    month: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    year: PropTypes.number,
    showOtherMonthDate: PropTypes.bool,
    styleWeekend: PropTypes.bool,
    renderDay: PropTypes.func,
    tabIndex: PropTypes.number,
    'aria-label': PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    preventFocusStyleForTouchAndClick: PropTypes.bool,

    // event callbacks for wrapper
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyDown: PropTypes.func,
    onMouseDown: PropTypes.func,
    onMouseUp: PropTypes.func,
    onTouchStart: PropTypes.func,
    onTouchEnd: PropTypes.func,
    onTouchCancel: PropTypes.func,

    // event callbacks for previous month and next month navigation links
    onPrevMonthNavMouseDown: PropTypes.func,
    onPrevMonthNavMouseUp: PropTypes.func,
    onPrevMonthNavTouchStart: PropTypes.func,
    onPrevMonthNavTouchEnd: PropTypes.func,
    onNextMonthNavMouseDown: PropTypes.func,
    onNextMonthNavMouseUp: PropTypes.func,
    onNextMonthNavTouchStart: PropTypes.func,
    onNextMonthNavTouchEnd: PropTypes.func,

    // event callbacks for days
    onDayMouseOver: PropTypes.func,
    onDayMouseOut: PropTypes.func,
    onDayMouseDown: PropTypes.func,
    onDayMouseUp: PropTypes.func,
    onDayTouchStart: PropTypes.func,
    onDayTouchEnd: PropTypes.func,
    onDayTouchCancel: PropTypes.func,

    // callbacks for change of values
    onUpdate: PropTypes.func,
    onMonthYearChange: PropTypes.func,

    // props for wrapper and day
    wrapperProps: PropTypes.object,
    dayProps: PropTypes.object,

    // ClassNames
    wrapperClassName: PropTypes.string,
    navBarClassName: PropTypes.string,
    prevMonthNavClassName: PropTypes.string,
    prevMonthNavIconClassName: PropTypes.string,
    nextMonthNavClassName: PropTypes.string,
    nextMonthNavIconClassName: PropTypes.string,
    monthLabelClassName: PropTypes.string,
    dayLabelClassName: PropTypes.string,
    dayClassName: PropTypes.string,

    // wrapper styles
    style: PropTypes.object,
    disabledStyle: PropTypes.object,
    readOnlyStyle: PropTypes.object,
    hoverStyle: PropTypes.object,
    activeStyle: PropTypes.object,
    focusStyle: PropTypes.object,
    disabledHoverStyle: PropTypes.object,

    // navbar styles
    navBarStyle: PropTypes.object,

    // prevMonthNav styles
    prevMonthNavStyle: PropTypes.object,
    prevMonthNavIconStyle: PropTypes.object,
    hoverPrevMonthNavStyle: PropTypes.object,
    activePrevMonthNavStyle: PropTypes.object,

    // nextMonthNav styles
    nextMonthNavStyle: PropTypes.object,
    nextMonthNavIconStyle: PropTypes.object,
    hoverNextMonthNavStyle: PropTypes.object,
    activeNextMonthNavStyle: PropTypes.object,

    weekHeaderStyle: PropTypes.object,

    // monthlbl styles
    monthLabelStyle: PropTypes.object,

    // daylbl styles
    dayLabelStyle: PropTypes.object,
    disabledDayLabelStyle: PropTypes.object,
    weekendLabelStyle: PropTypes.object,

    // day styles
    dayStyle: PropTypes.object,
    disabledDayStyle: PropTypes.object,
    readOnlyDayStyle: PropTypes.object,
    activeDayStyle: PropTypes.object,
    focusDayStyle: PropTypes.object,
    disabledHoverDayStyle: PropTypes.object,
    todayStyle: PropTypes.object,
    selectedDayStyle: PropTypes.object,
    otherMonthDayStyle: PropTypes.object,
    weekendStyle: PropTypes.object,
  };

  static defaultProps = {
    month: CURRENT_MONTH + 1,
    year: CURRENT_YEAR,
    tabIndex: 0,
    'aria-label': 'datepicker',
    disabled: false,
    readOnly: false,
    showOtherMonthDate: true,
    styleWeekend: false,
  };

  /**
   * Generates the style-id based on React's unique DOM node id.
   * Calls function to inject the pseudo classes into the dom.
   */
  componentWillMount() {
    const id = this._reactInternalInstance._rootNodeID.replace(/\./g, '-');
    this.pseudoStyleIds = {};
    this.pseudoStyleIds.styleId = `wrapper-style-id${id}`;
    this.pseudoStyleIds.prevMonthNavStyleId = `prevMonthNav-style-id${id}`;
    this.pseudoStyleIds.nextMonthNavStyleId = `nextMonthNav-style-id${id}`;
    updatePseudoClassStyle(this.pseudoStyleIds, this.props, this.preventFocusStyleForTouchAndClick);
  }

  /**
   * Function will update component state and styles as new props are received.
   */
  componentWillReceiveProps(properties) {
    const newState = {
      month: properties.month - 1,
      year: properties.year,
    };

    if (has(properties, 'valueLink')) {
      newState.selectedDate = properties.valueLink.value;
    } else if (has(properties, 'value')) {
      newState.selectedDate = properties.value;
    }

    this.setState(newState);

    this.localeData = getLocaleData(properties.locale);
    this.wrapperProps = sanitizeWrapperProps(properties.wrapperProps);
    this.dayProps = sanitizeDayProps(properties.dayProps);
    this.preventFocusStyleForTouchAndClick = has(properties, 'preventFocusStyleForTouchAndClick') ? properties.preventFocusStyleForTouchAndClick : config.preventFocusStyleForTouchAndClick;

    removeAllStyles(Object.keys(this.pseudoStyleIds));
    updatePseudoClassStyle(this.pseudoStyleIds, properties, this.preventFocusStyleForTouchAndClick);
  }

  /**
   * Removes pseudo classes from the DOM once component gets unmounted.
   */
  componentWillUnmount() {
    removeAllStyles(Object.keys(this.pseudoStyleIds));
  }

  /**
   * Callback is called when wrapper is focused, it will conditionally set isFocused.
   *
   * In addition this.state.focusedDateKey will be set to current date of whichever month is displayed on date-picker (if this.state.focusedDateKey is undefined).
   */
  _onFocus() {
    if (!this.props.disabled) {
      if (!this.state.isActive) {
        const newState = {
          isFocused: true,
        };
        if (!this.state.focusedDateKey) {
          if (this.state.selectedDate && this.state.selectedDate.getMonth() === this.state.month && this.state.selectedDate.getFullYear() === this.state.year) {
            newState.focusedDateKey = convertDateToDateKey(this.state.selectedDate);
          } else if (this.state.month === CURRENT_MONTH && this.state.year === CURRENT_YEAR) {
            newState.focusedDateKey = getDateKey(CURRENT_YEAR, CURRENT_MONTH + 1, CURRENT_DATE);
          } else {
            newState.focusedDateKey = getDateKey(this.state.year, this.state.month + 1, 1);
          }
        }

        this.setState(newState);
      }
    }

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  }

  /**
   * Callback is called when wrapper is blurred, it will reset isFocused, focusedDateKey.
   */
  _onBlur() {
    if (!this.props.disabled) {
      this.setState({
        isFocused: false,
        focusedDateKey: undefined,
      });
    }

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  /**
    * Callback is called when wrapper receives mouseDown. Conditionally set isActive.
    */
  _onMouseDown(event) {
    if (!this.props.disabled && event.button === 0) {
      this.setState({
        isActive: true,
      });
    }

    if (this.props.onMouseDown) {
      this.props.onMouseDown(event);
    }
  }

  /**
   * Callback is called when wrapper receives mouseUp. Reset isActive.
   */
  _onMouseUp(event) {
    if (!this.props.disabled && event.button === 0) {
      this.setState({
        isActive: false,
      });
    }

    if (this.props.onMouseUp) {
      this.props.onMouseUp(event);
    }
  }

  /**
   * Callback is called when touch starts on wrapper. Conditionally sets isActive.
   */
  _onTouchStart(event) {
    if (!this.props.disabled && event.touches.length === 1) {
      this.setState({
        isActive: true,
      });
    }

    if (this.props.onTouchStart) {
      this.props.onTouchStart(event);
    }
  }

  /**
   * Callback is called when touch ends on wrapper. Reset isActive.
   */
  _onTouchEnd() {
    if (!this.props.disabled) {
      this.setState({
        isActive: false,
      });
    }

    if (this.props.onTouchEnd) {
      this.props.onTouchEnd(event);
    }
  }

  _onTouchCancel() {
    this.setState({
      isActive: false,
    });

    if (this.props.onTouchCancel) {
      this.props.onTouchCancel(event);
    }
  }

  /**
   * On keyDown on wrapper if date-picker is not disabled and some day is focused:
   * 1. arrow keys will navigate calendar
   * 2. enter key will set selectedDate of component
   * 3. space key will set / unset selectedDate
   * 4. props.onKeyDown will be called
   */
  _onKeyDown(event) {
    if (!this.props.disabled) {
      if (event.key === 'Home') {
        // Moves to the first day of the current month.
        event.preventDefault();
        this._focusOnTheFistDayOfTheMonth();
      } else if (event.key === 'End') {
        // Moves to the last day of the current month.
        event.preventDefault();
        const date = getLastDayForMonth(this.state.year, this.state.month);
        this.setState({
          focusedDateKey: convertDateToDateKey(date),
        });
      }

      if (this.state.focusedDateKey) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this._focusOtherDay(7);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          this._focusOtherDay(-7);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this._focusOtherDay(this.localeData.isRTL ? 1 : -1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          this._focusOtherDay(this.localeData.isRTL ? -1 : 1);
        } else if (event.key === 'PageUp') {
          // Moves to the same date in the previous month.
          event.preventDefault();

          // TODO extract this to a helper function and test various edge cases
          let date;
          const lastDayInMonth = getLastDayForMonth(this.state.year, this.state.month - 1);
          const focusedDate = new Date(this.state.focusedDateKey);

          // jump from March 30 to Feb 29
          if (focusedDate.getDate() > lastDayInMonth.getDate()) {
            date = lastDayInMonth;
          } else {
            date = new Date(this.state.focusedDateKey);
            date.setMonth(date.getMonth() - 1);
          }

          this.setState({
            focusedDateKey: convertDateToDateKey(date),
            month: date.getMonth(),
            year: date.getFullYear(),
            lastHoveredDay: undefined,
          });
        } else if (event.key === 'PageDown') {
          // Moves to the same date in the next month.
          event.preventDefault();

          // TODO extract this to a helper function and test various edge cases
          let date;
          const lastDayInMonth = getLastDayForMonth(this.state.year, this.state.month + 1);
          const focusedDate = new Date(this.state.focusedDateKey);

          // Use case: Jump from Jan 31 to Feb 29
          if (focusedDate.getDate() > lastDayInMonth.getDate()) {
            date = lastDayInMonth;
          } else {
            date = new Date(this.state.focusedDateKey);
            date.setMonth(date.getMonth() + 1);
          }

          this.setState({
            focusedDateKey: convertDateToDateKey(date),
            month: date.getMonth(),
            year: date.getFullYear(),
            lastHoveredDay: undefined,
          });
        } else if (event.key === 'Enter') {
          event.preventDefault();
          const date = new Date(this.state.focusedDateKey);
          this._triggerSelectDate(date.getDate(), date.getMonth(), date.getFullYear());
        } else if (event.key === ' ') {
          event.preventDefault();
          this._triggerToggleDate(new Date(this.state.focusedDateKey));
        }
      } else {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' ||
            event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          this._focusOnFallbackDay();
        }
      }
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  }

  /**
   * Callback is called when some day receives mouseDown.
   * It will conditionally set this.state.activeDay, this.state.focusedDateKey and call props.onDayMouseDown.
   *
   * Note: mouseEvent.button is supported by all browsers are are targeting: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
   */
  _onDayMouseDown(dateKey, event) {
    if (event.button === 0 && !this.props.disabled && !this.props.readOnly) {
      this.setState({
        activeDay: dateKey,
      });
    }

    if (this.props.onDayMouseDown) {
      this.props.onDayMouseDown(event);
    }
  }

  /**
   * Callback is called when some day receives mouseUp.
   * It will reset this.state.activeDay and call props.onDayMouseUp.
   */
  _onDayMouseUp(dateKey, day, month, year, event) {
    if (event.button === 0 && !this.props.disabled && !this.props.readOnly && this.state.activeDay === dateKey) {
      this._triggerSelectDate(day, month, year);
      this.setState({
        // Note: updating focusedDateKey in mouseOver normally would be good enough,
        // but it is necessary to set on mouseUp for the following edge case:
        // A user moves the cursor over a day. Moves on with the keyboard and
        // then without moving again just pressing the mouse. In this case
        // mouseOver did not get called again.
        focusedDateKey: dateKey,
        activeDay: undefined,
      });
    }

    if (this.props.onDayMouseUp) {
      this.props.onDayMouseUp(event);
    }
  }

  /**
   * Callback is called when some day receives MouseOver. It will conditionally set this.state.focusedDateKey.
   */
  _onDayMouseOver(dateKey) {
    if (!this.props.readOnly) {
      this.setState({
        focusedDateKey: dateKey,
      });
    }

    if (this.props.onDayMouseOver) {
      this.props.onDayMouseOver(event);
    }
  }

  /**
   * Callback is called when some day receives MouseOut. It will reset this.state.focusedDateKey.
   */
  _onDayMouseOut(dateKey, event) {
    if (!this.props.readOnly && event.button === 0 && this.state.focusedDateKey === dateKey) {
      this.setState({
        focusedDateKey: undefined,
        lastHoveredDay: this.state.focusedDateKey,
      });
    }

    if (this.props.onDayMouseOut) {
      this.props.onDayMouseOut(event);
    }
  }

  /**
   * Callback is called when some day receives touchStart.
   * It will conditionally set this.state.activeDay and call props.onDayTouchStart.
   */
  _onDayTouchStart(dateKey, event) {
    if (!this.props.disabled && !this.props.readOnly && event.touches.length === 1) {
      this.setState({
        activeDay: dateKey,
      });
    }

    if (this.props.onDayTouchStart) {
      this.props.onDayTouchStart(event);
    }
  }

  /**
   * Callback is called when some day receives touchEnd.
   * It will reset this.state.activeDay and call props.onDayTouchEnd.
   */
  _onDayTouchEnd(dateKey, day, month, year, event) {
    if (!this.props.disabled && !this.props.readOnly && event.touches.length === 1) {
      this._triggerSelectDate(day, month, year);
      if (this.state.activeDay === dateKey) {
        this.setState({
          activeDay: undefined,
        });
      }
    }

    if (this.props.onDayTouchEnd) {
      this.props.onDayTouchEnd(event);
    }
  }

  _onDayTouchCancel(dateKey, event) {
    this.setState({
      activeDay: undefined,
    });

    if (this.props.onDayTouchCancel) {
      this.props.onDayTouchCancel(event);
    }
  }

  /**
   * Depending on whether component is controlled or uncontrolled the function will update this.state.selectedDate.
   * It will also call props.onUpdate.
   */
  _triggerSelectDate(day, month, year) {
    if (!this.props.disabled && !this.props.readOnly) {
      const selectedDate = day ? new Date(year, month, day) : undefined;

      if (has(this.props, 'valueLink')) {
        this.props.valueLink.requestChange(selectedDate);
      } else if (!has(this.props, 'value')) {
        this.setState({
          selectedDate: selectedDate,
          month: month,
          year: year,
        });
      }

      if (this.props.onUpdate) {
        this.props.onUpdate({
          value: selectedDate,
        });
      }
    }
  }

  /**
   * Function will select / deselect date passed to it, it is used in case of 'Space' keyDown on a day.
   */
  _triggerToggleDate(date) {
    if (!this.props.disabled && !this.props.readOnly) {
      let day;
      let month;
      let year;
      if (this.state.selectedDate && date && this.state.selectedDate.getDate() === date.getDate() && this.state.selectedDate.getMonth() === date.getMonth() && this.state.selectedDate.getFullYear() === date.getFullYear()) {
        day = undefined;
        month = this.state.month;
        year = this.state.year;
      } else {
        day = date.getDate();
        month = date.getMonth();
        year = date.getFullYear();
      }

      this._triggerSelectDate(day, month, year);
    }
  }

  _focusOnTheFistDayOfTheMonth() {
    this.setState({
      focusedDateKey: `${this.state.year}-${this.state.month + 1}-1`,
    });
  }

  _focusOnFallbackDay() {
    if (this.state.lastHoveredDay) {
      this.setState({
        focusedDateKey: this.state.lastHoveredDay,
      });
    } else {
      this._focusOnTheFistDayOfTheMonth();
    }
  }

  /**
   * The function is mainly used when some day is focused and Arrow keys are pressed to navigate to some other day.
   * days is the number of days by which focused should be moved ahead or behind.
   */
  _focusOtherDay(days) {
    const focusedDateKey = new Date(this.state.focusedDateKey);
    const currentMonth = focusedDateKey.getMonth();

    const nextFocusedDate = new Date(this.state.focusedDateKey);
    nextFocusedDate.setDate(nextFocusedDate.getDate() + days);
    const nextFocusedDateKey = `${nextFocusedDate.getFullYear()}-${nextFocusedDate.getMonth() + 1}-${nextFocusedDate.getDate()}`;
    const nextMonth = nextFocusedDate.getMonth();

    if (nextMonth !== currentMonth) {
      if ((nextMonth < currentMonth || (nextMonth === 11 && currentMonth === 0)) &&
          !(nextMonth === 0 && currentMonth === 11)) {
        this._decreaseMonthYear();
      } else if ((nextMonth > currentMonth || (nextMonth === 0 && currentMonth === 11)) &&
          !(nextMonth === 11 && currentMonth === 0)) {
        this._increaseMonthYear();
      }
    }

    this.setState({
      focusedDateKey: nextFocusedDateKey,
    });
  }

  /**
   * The function will decrease current month in state. It will also call props.onMonthYearChange.
   */
  _decreaseMonthYear() {
    let newMonth;
    let newYear;
    if (this.state.month === 0) {
      newMonth = 11;
      newYear = this.state.year - 1;
    } else {
      newMonth = this.state.month - 1;
      newYear = this.state.year;
    }

    this.setState({
      month: newMonth,
      year: newYear,
      focusedDateKey: undefined,
      lastHoveredDay: undefined,
    });
    if (this.props.onMonthYearChange) {
      this.props.onMonthYearChange(newMonth + 1, newYear);
    }
  }

  /**
   * The function will increase current month in state. It will also call props.onMonthYearChange.
   */
  _increaseMonthYear() {
    let newMonth;
    let newYear;
    if (this.state.month === 11) {
      newMonth = 0;
      newYear = this.state.year + 1;
    } else {
      newMonth = this.state.month + 1;
      newYear = this.state.year;
    }

    this.setState({
      month: newMonth,
      year: newYear,
      focusedDateKey: undefined,
      lastHoveredDay: undefined,
    });
    if (this.props.onMonthYearChange) {
      this.props.onMonthYearChange(newMonth + 1, newYear);
    }
  }

  _renderPrevMonthNav() {
    const prevMonthNavStyle = {
      ...defaultStyle.prevMonthNavStyle,
      ...this.props.prevMonthNavStyle,
    };

    const prevMonthNavIconStyle = {
      ...defaultStyle.prevMonthNavIconStyle,
      ...this.props.prevMonthNavIconStyle,
    };

    return (
      <ActionArea onClick={ ::this._decreaseMonthYear }
                  style={ prevMonthNavStyle }
                  className={ unionClassNames(this.props.prevMonthNavClassName, this.pseudoStyleIds.prevMonthNavStyleId) }>
        <div style={ prevMonthNavIconStyle }
             className={this.props.prevMonthNavIconClassName}/>
      </ActionArea>
    );
  }

  _renderNextMonthNav() {
    const nextMonthNavStyle = {
      ...defaultStyle.nextMonthNavStyle,
      ...this.props.nextMonthNavStyle,
    };

    const nextMonthNavIconStyle = {
      ...defaultStyle.nextMonthNavIconStyle,
      ...this.props.nextMonthNavIconStyle,
    };

    return (
      <ActionArea onClick={ ::this._increaseMonthYear }
                  style= { nextMonthNavStyle }
                  className={ unionClassNames(this.props.nextMonthNavClassName, this.pseudoStyleIds.nextMonthNavStyleId) }>
        <div style={ nextMonthNavIconStyle }
             className={this.props.nextMonthNavIconClassName}/>
      </ActionArea>
    );
  }

  /**
   * Function will return jsx for rendering the nav bar for calendar.
   * Depending on following rules it will apply styles to prevMonthNav and nextMonthNav:
   * 1. If disabled hide navs
   * 2. If active apply activeStyles
   */
  _renderNavBar() {
    const navBarStyle = {
      ...defaultStyle.navBarStyle,
      ...this.props.navBarStyle,
    };
    const monthLabelStyle = {
      ...defaultStyle.monthLabelStyle,
      ...this.props.monthLabelStyle,
    };

    return (
      <div style={ navBarStyle }
           className={ this.props.navBarClassName }>
        { this._renderPrevMonthNav() }
        <span style={ monthLabelStyle }
              className={ this.props.monthLabelClassName }
              role="heading"
              /*
                This label has an id as suggested in http://www.w3.org/TR/wai-aria-practices/#datepicker
              */
              id={ `${this.state.year}-${this.state.month}` }>
          { `${this.localeData.monthNames[this.state.month]} ${this.state.year}` }
        </span>
        { this._renderNextMonthNav() }
      </div>
    );
  }

  /**
   * Function will return jsx for rendering the week header for calendar.
   * Disabled styles will be applied for disabled date-picker.
   * Day headers will be rendered using locale information.
   */
  _renderWeekHeader() {
    const weekHeaderStyle = {
      ...defaultStyle.weekHeaderStyle,
      ...this.props.weekHeaderStyle,
    };

    let dayLabelStyle = {
      ...defaultStyle.dayLabelStyle,
      ...this.props.dayLabelStyle,
    };
    if (this.props.disabled) {
      dayLabelStyle = {
        ...dayLabelStyle,
        ...defaultStyle.disabledDayLabelStyle,
        ...this.props.disabledDayLabelStyle,
      };
    }

    const weekendLabelStyle = {
      ...dayLabelStyle,
      ...defaultStyle.weekendLabelStyle,
      ...this.props.weekendLabelStyle,
    };
    let dayNames = shift(this.localeData.dayNamesMin, this.localeData.firstDay);
    dayNames = this.localeData.isRTL ? reverse(dayNames) : dayNames;
    let weekendIndex = ((7 - this.localeData.firstDay) % 7) + this.localeData.weekEnd;
    weekendIndex = this.localeData.isRTL ? 6 - weekendIndex : weekendIndex;

    return (
      <div style={ weekHeaderStyle }>
        {
          map(dayNames, (dayAbbr, index) => {
            return (
              <span key={ 'dayAbbr-' + index }
                    style={ (this.props.styleWeekend && index === weekendIndex) ? weekendLabelStyle : dayLabelStyle }
                    className={ this.props.dayLabelClassName }
                    role="columnheader">
                  { dayAbbr }
                </span>
            );
          })
        }
      </div>
    );
  }

  // According to http://www.w3.org/TR/wai-aria-1.1/#aria-current an empty value for aria-current indicated false.
  /**
   * Function will return jsx for rendering the a day.
   * It will apply various styles in sequence as below (styles will be additive):
   * 1. If component is readOnly apply readOnly styles
   * 2. If component is disabled apply disabled styles
   *    - If component is disabled and hovered apply disableHover styles
   * 3. If day is weekend apply weekendStyle
   * 4. If its day in current month and component is not disabled or readOnly:
   *    - If its current day apply todayStyle
   *    - If this is selected day apply selectedDayStyle
   *    - If component is hovered apply hover styles
   *    - If component is hovered and active apply hoveredStyles + activeStyles
   *    - If component is hovered and not active but focused and preventFocusStyleForTouchAndClick apply focus styles
   * 5. If current day represents other months day in calendar apply otherMonthDayStyle
   */
  _renderDay(currentDate, index) {
    const day = currentDate.getDate();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const isOtherMonth = currentDate.getMonth() !== this.state.month;
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;

    let ariaCurrent = '';
    let ariaSelected = false;

    let dayStyle = {
      ...defaultStyle.dayStyle,
      ...this.props.dayStyle,
    };

    if (this.props.readOnly) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.readOnlyDayStyle,
        ...this.props.readOnlyDayStyle,
      };
    }

    if (this.props.disabled) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.disabledDayStyle,
        ...this.props.disabledDayStyle,
      };
      if (!isOtherMonth && this.state.focusedDateKey === dateKey) {
        dayStyle = {
          ...dayStyle,
          ...defaultStyle.disabledHoverDayStyle,
          ...this.props.disabledHoverDayStyle,
        };
      }
    }

    if (this.props.styleWeekend && currentDate.getDay() === this.localeData.weekEnd) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.weekendStyle,
        ...this.props.weekendStyle,
      };
    }

    if (isOtherMonth) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.otherMonthDayStyle,
        ...this.props.otherMonthDayStyle,
      };
    }

    if (day === CURRENT_DATE && this.state.month === CURRENT_MONTH && this.state.year === CURRENT_YEAR) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.todayStyle,
        ...this.props.todayStyle,
      };
      ariaCurrent = 'date';
    }

    if (this.state.selectedDate && day === this.state.selectedDate.getDate()
      && currentDate.getMonth() === this.state.selectedDate.getMonth() && currentDate.getFullYear() === this.state.selectedDate.getFullYear()) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.selectedDayStyle,
        ...this.props.selectedDayStyle,
      };
      ariaSelected = true;
    }

    if (!this.props.disabled && this.state.focusedDateKey === dateKey) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.focusDayStyle,
        ...this.props.focusDayStyle,
      };
    }

    if (!this.props.disabled && !this.props.readOnly && this.state.activeDay === dateKey) {
      dayStyle = {
        ...dayStyle,
        ...defaultStyle.activeDayStyle,
        ...this.props.activeDayStyle,
      };
    }

    const renderedDay = this.props.renderDay ? this.props.renderDay(currentDate) : day;

    if (!isOtherMonth || this.props.showOtherMonthDate) {
      return (
        <span key={ 'day-' + index }
              ref={ dateKey }
              onMouseDown={ this._onDayMouseDown.bind(this, dateKey) }
              onMouseUp={ this._onDayMouseUp.bind(this, dateKey, day, month, year) }
              onMouseOver={ this._onDayMouseOver.bind(this, dateKey) }
              onMouseOut={ this._onDayMouseOut.bind(this, dateKey) }
              onTouchStart={ this._onDayTouchStart.bind(this, dateKey) }
              onTouchEnd={ this._onDayTouchEnd.bind(this, dateKey, day, month, year) }
              onTouchCancel={ this._onDayTouchCancel.bind(this, dateKey) }
              aria-current={ ariaCurrent }
              aria-selected={ ariaSelected }
              style={ dayStyle }
              className={ this.props.dayClassName }
              role="gridcell"
              {...this.dayProps}>
          { renderedDay }
        </span>
      );
    }

    return (
      <span key={ 'day-' + index }
            ref={ dateKey }
            style={ dayStyle }
            className={ this.props.dayClassName }
            {...this.dayProps}>
      </span>
    );
  }

  /**
   * Function will render:
   * - main calendar component
   * - call methods to render navBar and week header
   * - get array of weeks in a month and for each day in the week call method to render day
   *
   * It will apply styles sequentially according to Wrapper according to following rules:
   * 1. If component is readOnly apply readOnlyStyle
   * 2. If component is disabled apply disabledStyle
   *    - If disabled component is hovered apply disabledHoverStyle
   * 3. If component is not disabled:
   *    - If component is hovered apply hover style
   *    - If component is hovered and active apply hover + active styles
   *    - If component is hovered and focused but not active and preventFocusStyleForTouchAndClick is true apply focusStyles
   */
  render() {
    let style = {
      ...defaultStyle.style,
      ...this.props.style,
    };
    if (this.props.readOnly) {
      style = {
        ...style,
        ...defaultStyle.readOnlyStyle,
        ...this.props.readOnlyStyle,
      };
    }

    if (this.props.disabled) {
      style = {
        ...style,
        ...defaultStyle.disabledStyle,
        ...this.props.disabledStyle,
      };
    }

    if (this.preventFocusStyleForTouchAndClick && this.state.isFocused) {
      style = {
        ...style,
        ...defaultStyle.focusStyle,
        ...this.props.focusStyle,
      };
    }

    if (this.state.isActive) {
      style = {
        ...style,
        ...defaultStyle.activeStyle,
        ...this.props.activeStyle,
      };
    }

    const weekArray = getWeekArrayForMonth(this.state.month, this.state.year, this.localeData.firstDay);

    const tabIndex = !this.props.disabled ? this.props.tabIndex : false;

    return (
      <div ref="datePicker"
           tabIndex={ tabIndex }
           disabled={ this.props.disabled }
           onFocus={ ::this._onFocus }
           onBlur={ ::this._onBlur }
           onKeyDown={ ::this._onKeyDown }
           onMouseDown={ ::this._onMouseDown }
           onMouseUp={ ::this._onMouseUp }
           onTouchStart={ ::this._onTouchStart }
           onTouchEnd={ ::this._onTouchEnd }
           onTouchCancel={ ::this._onTouchCancel }
           aria-label={ this.props['aria-label'] }
           aria-disabled={ this.props.disabled }
           aria-readonly={ this.props.readOnly }
           style={ style }
           className={ unionClassNames(this.props.wrapperClassName, this.pseudoStyleIds.styleId) }
           {...this.wrapperProps} >
        { this._renderNavBar() }
        <div role="grid" style={ defaultStyle.weekGroupStyle}>
          { this._renderWeekHeader() }
          {
            map(weekArray, (week) => {
              const weekDays = this.localeData.isRTL ? reverse(week) : week;
              return map(weekDays, (day, dayIndex) => {
                return this._renderDay(day, dayIndex);
              });
            })
          }
        </div>
      </div>
    );
  }
}
