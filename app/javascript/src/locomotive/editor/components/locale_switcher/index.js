import React, { useState } from 'react';
import i18n from '../../i18n';

// Components
import Dropdown from '../dropdown';

const LocaleSwitcher = ({ locale, locales, handleSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="locale-switcher">
      <Dropdown
        open={open}
        onClose={() => setOpen(false)}
        target={
          <a className="locale-switcher-button" role="button" onClick={() => setOpen(!open)}>
            {locale}
            &nbsp;
            <span className="caret" />
          </a>
        }
      >
        <ul className="locale-switcher-locales">
          {locales.map(_locale => (
            <li key={_locale} className="locale-switcher-locale">
              <a
                onClick={e => { setOpen(false); handleSelect(_locale); }}
                dangerouslySetInnerHTML={{ __html: i18n.t('components.locale_switcher.locale', { locale: _locale }) }}
              />
            </li>
          ))}
        </ul>
      </Dropdown>
    </div>
  );
}

export default LocaleSwitcher;
