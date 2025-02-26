import exp from "constants";

const hourglassIconLabel = "Hourglass icon";
export const Hourglass = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 17 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={hourglassIconLabel}
  >
    <path
      d="M16.8522 20.5898C16.412 16.7303 14.6444 15.1306 13.3534 13.9641C12.4608 13.1544 12.0317 12.7333 12.0317 12C12.0317 11.2767 12.4593 10.8636 13.3494 10.0705C14.6555 8.90748 16.4442 7.3143 16.8532 3.40262C16.8859 3.07399 16.849 2.74217 16.7449 2.42865C16.6407 2.11513 16.4717 1.82688 16.2487 1.58256C16.0106 1.32161 15.7203 1.11326 15.3964 0.97096C15.0725 0.828657 14.7223 0.755553 14.3684 0.75636L3.24746 0.75636C2.89302 0.755257 2.54229 0.828213 2.21789 0.970521C1.89349 1.11283 1.60263 1.32133 1.36409 1.58256C1.14178 1.82722 0.973398 2.11559 0.869807 2.42908C0.766216 2.74257 0.729715 3.07421 0.762657 3.40262C1.17016 7.30175 2.95229 8.88338 4.25337 10.0379C5.15199 10.8355 5.58418 11.2516 5.58418 12C5.58418 12.7579 5.15099 13.1826 4.24934 13.9952C2.96488 15.1547 1.20189 16.7424 0.763665 20.5898C0.728082 20.9169 0.762182 21.2479 0.863737 21.561C0.965292 21.8741 1.13201 22.1623 1.35301 22.4068C1.59205 22.6711 1.88432 22.8822 2.21074 23.0264C2.53716 23.1706 2.89041 23.2446 3.24746 23.2436H14.3684C14.7254 23.2446 15.0787 23.1706 15.4051 23.0264C15.7315 22.8822 16.0238 22.6711 16.2629 22.4068C16.4838 22.1623 16.6506 21.8741 16.7521 21.561C16.8537 21.2479 16.8878 20.9169 16.8522 20.5898ZM13.2053 20.8342H4.43219C3.6464 20.8342 3.42477 19.9307 3.97583 19.3706C5.30966 18.0233 8.00199 17.0586 8.00199 15.5136V10.3937C8.00199 9.39738 6.08789 8.63693 4.90367 7.02066C4.70823 6.75412 4.72787 6.37816 5.22453 6.37816H12.414C12.8376 6.37816 12.9288 6.75111 12.7364 7.01815C11.5693 8.63693 9.61387 9.39236 9.61387 10.3937V15.5136C9.61387 17.046 12.42 17.8727 13.6637 19.3721C14.1649 19.9764 13.9896 20.8342 13.2053 20.8342Z"
      fill="var(--error-success-100)"
    />
  </svg>
);

const hatIconLabel = "Hat icon";
export const HatIcon = ({ color }: { color?: string }) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 25 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={hatIconLabel}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.9926 0.0755887C12.235 -0.0251962 12.5054 -0.0251962 12.7479 0.0755887L23.4447 4.52265C23.8312 4.68335 24.0847 5.07279 24.0847 5.50588C24.0847 5.93898 23.8312 6.32841 23.4447 6.48912L12.7479 10.9362C12.5054 11.037 12.235 11.037 11.9926 10.9362L1.29582 6.48912C0.909274 6.32841 0.655762 5.93898 0.655762 5.50588C0.655762 5.07279 0.909274 4.68335 1.29582 4.52265L11.9926 0.0755887ZM4.41609 5.50588L12.3702 8.81272L20.3244 5.50588L12.3702 2.19905L4.41609 5.50588Z"
      fill={color ?? "var(--error-success-100)"}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M23.0671 4.50537C23.6292 4.50537 24.0848 4.97942 24.0848 5.56419V10.447C24.0848 11.0317 23.6292 11.5058 23.0671 11.5058C22.5051 11.5058 22.0494 11.0317 22.0494 10.447V5.56419C22.0494 4.97942 22.5051 4.50537 23.0671 4.50537ZM6.53599 6.78978C7.09803 6.78978 7.55366 7.26383 7.55366 7.84861V13.9554C7.57073 13.9699 7.58846 13.9848 7.60687 14.0001C7.85783 14.2089 8.22825 14.4908 8.69473 14.7731C9.63558 15.3424 10.9161 15.8824 12.3703 15.8824C13.8249 15.8824 15.1055 15.3424 16.0464 14.7731C16.5129 14.4908 16.8833 14.2089 17.1343 14.0001C17.1527 13.9848 17.1704 13.9699 17.1875 13.9554V7.84861C17.1875 7.26383 17.6431 6.78978 18.2052 6.78978C18.7672 6.78978 19.2229 7.26383 19.2229 7.84861V14.4355C19.2229 14.7193 19.1134 14.9912 18.919 15.1903L18.2052 14.4355C18.919 15.1903 18.9187 15.1905 18.9184 15.1908L18.9165 15.1927L18.9132 15.1961L18.9038 15.2056C18.8963 15.2131 18.8864 15.2229 18.8741 15.2349C18.8496 15.259 18.8155 15.2917 18.7723 15.332C18.6859 15.4125 18.5626 15.5232 18.4054 15.654C18.0916 15.9151 17.6384 16.2595 17.0696 16.6037C15.9399 17.2872 14.3031 18.0001 12.3703 18.0001C10.4378 18.0001 8.80108 17.2872 7.67146 16.6037C7.10271 16.2595 6.64958 15.9151 6.33579 15.654C6.17854 15.5232 6.05525 15.4125 5.96887 15.332C5.92566 15.2917 5.89159 15.259 5.86705 15.2349C5.85477 15.2229 5.84487 15.2131 5.83738 15.2056L5.82797 15.1961L5.82463 15.1927L5.82273 15.1908C5.82247 15.1905 5.82221 15.1903 6.53599 14.4355L5.82221 15.1903C5.6278 14.9912 5.51831 14.7193 5.51831 14.4355V7.84861C5.51831 7.26383 5.97394 6.78978 6.53599 6.78978Z"
      fill={color ?? "var(--error-success-100)"}
    />
  </svg>
);

const greenTickLabel = "Green tick icon";

export const GreenTick = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 22 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={greenTickLabel}
  >
    <path
      d="M7.12572 18L0 10.8069L3.24731 7.52896L7.12572 11.4556L18.4626 0L21.7099 3.27799L7.12572 18Z"
      fill="var(--error-success-100)"
    />
  </svg>
);

const purpleStarLabel = "Purple star icon";
export const PurpleStar = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 19 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={purpleStarLabel}
  >
    <path
      d="M4.00096 17.7714L5.48829 11.2852L0.5 6.92253L7.09004 6.34546L9.65283 0.228516L12.2156 6.34546L18.8057 6.92253L13.8174 11.2852L15.3047 17.7714L9.65283 14.3321L4.00096 17.7714Z"
      fill="var(--theme-module3-100)"
    />
  </svg>
);

const redCrossLabel = "Red cross icon";
export const RedCross = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={redCrossLabel}
  >
    <path
      d="M15.6959 0.405762L9.24924 6.85144L2.80413 0.405762L0.655762 2.55432L7.10087 9L0.655762 15.4457L2.80413 17.5942L9.24924 11.1486L15.6959 17.5942L17.8442 15.4457L11.3991 9L17.8442 2.55432L15.6959 0.405762Z"
      fill="var(--error-failure-100)"
    />
  </svg>
);

const bellIconLabel = "Bell icon";
export const Bell = ({ color }: { color?: string }) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 22 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={bellIconLabel}
  >
    <path
      d="M19.1881 16.4137V17.3629H1.91883V16.4137L3.83764 14.5152V8.81965C3.83764 5.87696 5.78523 3.2855 8.63467 2.45016V2.17487C8.63467 1.67136 8.83683 1.18847 9.19667 0.832427C9.55652 0.476388 10.0446 0.276367 10.5535 0.276367C11.0624 0.276367 11.5504 0.476388 11.9103 0.832427C12.2701 1.18847 12.4723 1.67136 12.4723 2.17487V2.45016C15.3217 3.2855 17.2693 5.87696 17.2693 8.81965V14.5152L19.1881 16.4137ZM12.4723 18.3122C12.4723 18.8157 12.2701 19.2986 11.9103 19.6546C11.5504 20.0107 11.0624 20.2107 10.5535 20.2107C10.0446 20.2107 9.55652 20.0107 9.19667 19.6546C8.83683 19.2986 8.63467 18.8157 8.63467 18.3122M17.9889 1.40598L16.6265 2.75392C17.438 3.54694 18.0822 4.49146 18.5219 5.53269C18.9617 6.57393 19.1881 7.69117 19.1881 8.81965H21.1069C21.1069 6.03834 19.994 3.36144 17.9889 1.40598ZM1.8225e-05 8.81965H1.91883C1.91883 6.54144 2.83986 4.35816 4.48044 2.75392L3.11809 1.40598C2.12787 2.37571 1.34229 3.53047 0.807015 4.80318C0.271736 6.07588 -0.00257565 7.44115 1.8225e-05 8.81965Z"
      fill={color ?? "var(--error-warning-100)"}
    />
  </svg>
);

const exitIconLabel = "Exit icon";
export const ExitIcon = ({ color }: { color?: string }) => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill={color ?? "none"}
    xmlns="http://www.w3.org/2000/svg"
    aria-label={exitIconLabel}
  >
    <path
      d="M47.2967 43.9009C47.5197 44.1239 47.6965 44.3886 47.8172 44.6799C47.9379 44.9712 48 45.2835 48 45.5988C48 45.9141 47.9379 46.2264 47.8172 46.5177C47.6965 46.809 47.5197 47.0737 47.2967 47.2967C47.0737 47.5197 46.809 47.6965 46.5177 47.8172C46.2264 47.9379 45.9141 48 45.5988 48C45.2835 48 44.9712 47.9379 44.6799 47.8172C44.3886 47.6965 44.1239 47.5197 43.9009 47.2967L24 27.3928L4.09911 47.2967C3.64879 47.747 3.03804 48 2.4012 48C1.76436 48 1.15361 47.747 0.703295 47.2967C0.252983 46.8464 1.25536e-08 46.2356 0 45.5988C-1.25536e-08 44.962 0.252983 44.3512 0.703295 43.9009L20.6072 24L0.703295 4.09911C0.252983 3.64879 -4.74481e-09 3.03804 0 2.4012C4.74481e-09 1.76436 0.252983 1.15361 0.703295 0.703295C1.15361 0.252983 1.76436 4.74481e-09 2.4012 0C3.03804 -4.74481e-09 3.64879 0.252983 4.09911 0.703295L24 20.6072L43.9009 0.703295C44.3512 0.252983 44.962 -1.25536e-08 45.5988 0C46.2356 1.25536e-08 46.8464 0.252983 47.2967 0.703295C47.747 1.15361 48 1.76436 48 2.4012C48 3.03804 47.747 3.64879 47.2967 4.09911L27.3928 24L47.2967 43.9009Z"
      fill="white"
    />
  </svg>
);

const logOutIconLabel = "Log out icon";
export const LogoutIcon = () => (
  <svg
    width="17"
    height="18"
    viewBox="0 0 17 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={logOutIconLabel}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.3396 0H1.87993C1.38134 0 0.903173 0.189642 0.550618 0.527208C0.198063 0.864773 0 1.32261 0 1.8V16.2C0 16.6774 0.198063 17.1352 0.550618 17.4728C0.903173 17.8104 1.38134 18 1.87993 18H10.3396C10.8382 18 11.3164 17.8104 11.6689 17.4728C12.0215 17.1352 12.2195 16.6774 12.2195 16.2V15.3C12.2195 15.0613 12.1205 14.8324 11.9442 14.6636C11.7679 14.4948 11.5289 14.4 11.2796 14.4C11.0303 14.4 10.7912 14.4948 10.6149 14.6636C10.4386 14.8324 10.3396 15.0613 10.3396 15.3V16.2H1.87993V1.8H10.3396V2.7C10.3396 2.93869 10.4386 3.16761 10.6149 3.3364C10.7912 3.50518 11.0303 3.6 11.2796 3.6C11.5289 3.6 11.7679 3.50518 11.9442 3.3364C12.1205 3.16761 12.2195 2.93869 12.2195 2.7V1.8C12.2195 1.32261 12.0215 0.864773 11.6689 0.527208C11.3164 0.189642 10.8382 0 10.3396 0ZM13.3522 12.8656C12.9856 13.2166 12.3934 13.2166 12.0269 12.8656C11.8511 12.6972 11.7524 12.4689 11.7522 12.2308C11.752 11.9928 11.8505 11.7644 12.0259 11.5957L13.7893 9.90009H5.6398C5.39051 9.90009 5.15142 9.80527 4.97515 9.63648C4.79887 9.4677 4.69984 9.23878 4.69984 9.00009C4.69984 8.76139 4.79887 8.53247 4.97515 8.36369C5.15142 8.19491 5.39051 8.10009 5.6398 8.10009H13.7893L12.0259 6.40449C11.8644 6.23341 11.7778 6.00945 11.7838 5.77892C11.7899 5.54839 11.8883 5.32891 12.0586 5.16585C12.2289 5.00279 12.4581 4.90862 12.6989 4.9028C12.9396 4.89698 13.1735 4.97996 13.3522 5.13459L16.7248 8.36379C16.901 8.53256 17 8.76144 17 9.00009C17 9.23873 16.901 9.46761 16.7248 9.63639L13.3522 12.8656Z"
      fill="#666666"
    />
  </svg>
);

const calendarIconLabel = "Calendar icon";
export const CalendarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={calendarIconLabel}
  >
    <path
      d="M18 2V4M6 2V4"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897"
      stroke="#8E92BC"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 8H20.5"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 8H21"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const hallOfFameIconLabel = "Hall of fame icon";
export const HallOfFameIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={hallOfFameIconLabel}
  >
    <path
      d="M12 17C10.3264 17 8.86971 18.265 8.11766 20.1312C7.75846 21.0225 8.27389 22 8.95877 22H15.0412C15.7261 22 16.2415 21.0225 15.8823 20.1312C15.1303 18.265 13.6736 17 12 17Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M18.5 5H19.7022C20.9031 5 21.5035 5 21.8168 5.37736C22.13 5.75472 21.9998 6.32113 21.7393 7.45395L21.3485 9.15307C20.7609 11.7086 18.6109 13.6088 16 14"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 5H4.29779C3.09692 5 2.49649 5 2.18324 5.37736C1.86999 5.75472 2.00024 6.32113 2.26075 7.45395L2.65148 9.15307C3.23914 11.7086 5.38912 13.6088 8 14"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17C15.0208 17 17.565 12.3379 18.3297 5.99089C18.5412 4.23558 18.647 3.35793 18.0868 2.67896C17.5267 2 16.6223 2 14.8134 2H9.18658C7.37775 2 6.47333 2 5.91317 2.67896C5.35301 3.35793 5.45875 4.23558 5.67025 5.99089C6.435 12.3379 8.97923 17 12 17Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const homeIconLabel = "Home icon";
export const HomeIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={homeIconLabel}
  >
    <path
      d="M9 22L9.00192 17.9976C9.00236 17.067 9.00258 16.6017 9.15462 16.2347C9.35774 15.7443 9.74746 15.3547 10.2379 15.1519C10.6051 15 11.0704 15 12.001 15C12.9319 15 13.3974 15 13.7647 15.152C14.2553 15.355 14.645 15.7447 14.848 16.2353C15 16.6026 15 17.0681 15 17.999V22"
      stroke="#141522"
      strokeWidth="1.5"
    />
    <path
      d="M7.08848 4.76243L6.08847 5.54298C4.57181 6.72681 3.81348 7.31873 3.40674 8.15333C3 8.98792 3 9.95205 3 11.8803V13.9715C3 17.7562 3 19.6485 4.17157 20.8243C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8243C21 19.6485 21 17.7562 21 13.9715V11.8803C21 9.95205 21 8.98792 20.5933 8.15333C20.1865 7.31873 19.4282 6.72681 17.9115 5.54298L16.9115 4.76243C14.5521 2.92081 13.3724 2 12 2C10.6276 2 9.44787 2.92081 7.08848 4.76243Z"
      stroke="#141522"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const peopleIconLabel = "People icon";
export const PeopleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={peopleIconLabel}
  >
    <path
      d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
    />
    <path
      d="M15 11C17.2091 11 19 9.20914 19 7C19 4.79086 17.2091 3 15 3"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 14H7C4.23858 14 2 16.2386 2 19C2 20.1046 2.89543 21 4 21H14C15.1046 21 16 20.1046 16 19C16 16.2386 13.7614 14 11 14Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M17 14C19.7614 14 22 16.2386 22 19C22 20.1046 21.1046 21 20 21H18.5"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const resourcesIconLabel = "Resources icon";
export const ResourcesIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={resourcesIconLabel}
  >
    <path
      d="M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.788 11.0977C20.9293 11.2964 21 11.5036 21 11.7314C21 12.7132 19.6873 13.3114 17.0618 14.5077L15.357 15.2845C13.7048 16.0373 12.8786 16.4138 12 16.4138C11.1214 16.4138 10.2952 16.0373 8.64298 15.2845L6.93817 14.5077C4.31272 13.3114 3 12.7132 3 11.7314C3 11.5036 3.07067 11.2964 3.212 11.0977"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.3767 16.2656C20.7922 16.5966 21 16.9265 21 17.3171C21 18.299 19.6873 18.8971 17.0618 20.0934L15.357 20.8702C13.7048 21.6231 12.8786 21.9995 12 21.9995C11.1214 21.9995 10.2952 21.6231 8.64298 20.8702L6.93817 20.0934C4.31272 18.8971 3 18.299 3 17.3171C3 16.9265 3.20778 16.5966 3.62334 16.2656"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const lectureIconLabel = "Zoom meeting icon";
export const LectureIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={lectureIconLabel}
  >
    <path
      d="M2 10V8C2 7.05719 2 6.58579 2.29289 6.29289C2.58579 6 3.05719 6 4 6H7C10.7712 6 12.6569 6 13.8284 7.17157C15 8.34315 15 10.2288 15 14V16C15 16.9428 15 17.4142 14.7071 17.7071C14.4142 18 13.9428 18 13 18H10C6.22876 18 4.34315 18 3.17157 16.8284C2 15.6569 2 13.7712 2 10Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.8995 9.07049L18.5997 8.39526C20.0495 6.99707 20.7744 6.29798 21.3872 6.55106C22 6.80414 22 7.80262 22 9.79956V14.2004C22 16.1974 22 17.1959 21.3872 17.4489C20.7744 17.702 20.0495 17.0029 18.5997 15.6047L17.8995 14.9295C17.0122 14.0738 17 14.0453 17 12.8231V11.1769C17 9.95473 17.0122 9.92624 17.8995 9.07049Z"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const designIconLabel = "Design icon";
export const DesignIcon = () => (
  <svg
    width="33"
    height="30"
    viewBox="0 0 33 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={designIconLabel}
  >
    <path
      d="M20.625 18.75C22.9032 18.75 24.75 17.0711 24.75 15C24.75 12.9289 22.9032 11.25 20.625 11.25C18.3468 11.25 16.5 12.9289 16.5 15C16.5 17.0711 18.3468 18.75 20.625 18.75Z"
      stroke="black"
      strokeLinejoin="round"
    />
    <path
      d="M12.375 26.25C14.6532 26.25 16.5 24.5711 16.5 22.5V18.75H12.375C10.0968 18.75 8.25 20.4289 8.25 22.5C8.25 24.5711 10.0968 26.25 12.375 26.25Z"
      stroke="black"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 11.25V18.75H12.375C10.0968 18.75 8.25 17.0711 8.25 15C8.25 12.9289 10.0968 11.25 12.375 11.25H16.5Z"
      stroke="black"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 3.75V11.25H12.375C10.0968 11.25 8.25 9.57106 8.25 7.5C8.25 5.42894 10.0968 3.75 12.375 3.75H16.5Z"
      stroke="black"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 3.75V11.25H20.625C22.9032 11.25 24.75 9.57106 24.75 7.5C24.75 5.42894 22.9032 3.75 20.625 3.75H16.5Z"
      stroke="black"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const codeIconLabel = "Code icon";
export const CodeIcon = () => (
  <svg
    width="30"
    height="28"
    viewBox="0 0 30 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={codeIconLabel}
  >
    <path
      d="M24.0833 11.334L26.6897 13.9549C27.7855 15.0568 28.3333 15.6078 28.3333 16.2923C28.3333 16.9769 27.7855 17.5278 26.6897 18.6297L24.0833 21.2507"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.91669 11.334L7.31029 13.9549C6.21455 15.0568 5.66669 15.6078 5.66669 16.2923C5.66669 16.9769 6.21455 17.5278 7.31029 18.6297L9.91669 21.2507"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.8334 7.08398L14.1667 25.5007"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const darkModeIconLabel = "Dark mode icon";
export const DarkModeIcon = () => (
  <svg
    width="30"
    height="28"
    viewBox="0 0 30 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={darkModeIconLabel}
  >
    <path
      d="M30.4583 19.9437C28.7587 20.8511 26.8176 21.3657 24.7564 21.3657C18.0612 21.3657 12.6337 15.9381 12.6337 9.24289C12.6337 7.18165 13.1481 5.24056 14.0556 3.54102C8.02916 4.9534 3.54166 10.3624 3.54166 16.8196C3.54166 24.3517 9.64763 30.4577 17.1798 30.4577C23.6369 30.4577 29.0459 25.9702 30.4583 19.9437Z"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const lightModeIconLabel = "Light mode icon";
export const LightModeIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={lightModeIconLabel}
  >
    <path
      d="M24.0833 16.9993C24.0833 20.9113 20.912 24.0827 17 24.0827C13.088 24.0827 9.91666 20.9113 9.91666 16.9993C9.91666 13.0873 13.088 9.91602 17 9.91602C20.912 9.91602 24.0833 13.0873 24.0833 16.9993Z"
      stroke="black"
      strokeWidth="1.5"
    />
    <path
      d="M17 2.83398V4.95898M17 29.0423V31.1673M27.017 27.0183L25.5143 25.5157M8.4848 8.48544L6.98219 6.98283M31.1667 17.0007H29.0417M4.95834 17.0007H2.83334M27.0177 6.98299L25.515 8.48559M8.48549 25.5158L6.98289 27.0185"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const sidebarIconLabel = "Sidebar icon";
export const SidebarIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={sidebarIconLabel}
  >
    <path
      d="M2.83334 17C2.83334 11.7737 2.83334 9.16059 3.98626 7.30826C4.41279 6.62295 4.94263 6.02688 5.5518 5.54701C7.19832 4.25 9.5211 4.25 14.1667 4.25H19.8333C24.4789 4.25 26.8016 4.25 28.4482 5.54701C29.0574 6.02688 29.5872 6.62295 30.0138 7.30826C31.1667 9.16059 31.1667 11.7737 31.1667 17C31.1667 22.2262 31.1667 24.8394 30.0138 26.6917C29.5872 27.3771 29.0574 27.9731 28.4482 28.453C26.8016 29.75 24.4789 29.75 19.8333 29.75H14.1667C9.5211 29.75 7.19832 29.75 5.5518 28.453C4.94263 27.9731 4.41279 27.3771 3.98626 26.6917C2.83334 24.8394 2.83334 22.2262 2.83334 17Z"
      stroke="black"
      strokeWidth="1.5"
    />
    <path
      d="M13.4583 4.25V29.75"
      stroke="black"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M7.08334 9.91602H8.50001M7.08334 14.166H8.50001"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const notificationIconLabel = "Notification icon";
export const NotificationIcon = ({ color }: { color?: string }) => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={notificationIconLabel}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M17.5008 27.7871V27.5681C17.533 26.9202 17.7406 26.2925 18.1024 25.7496C18.7045 25.0975 19.1167 24.2983 19.2957 23.436C19.2957 22.7695 19.2957 22.0935 19.3539 21.427C19.6547 18.2184 22.8273 16 25.9611 16H26.0387C29.1725 16 32.345 18.2184 32.6555 21.427C32.7137 22.0935 32.6555 22.7695 32.704 23.436C32.8854 24.3003 33.2972 25.1019 33.8974 25.7591C34.2618 26.2972 34.4698 26.9227 34.4989 27.5681V27.7776C34.5206 28.648 34.2208 29.4968 33.6548 30.1674C32.907 30.9515 31.8921 31.4393 30.8024 31.5384C27.607 31.8812 24.383 31.8812 21.1876 31.5384C20.0991 31.435 19.0858 30.9479 18.3352 30.1674C17.778 29.4963 17.4822 28.6526 17.5008 27.7871Z"
      stroke="#8E92BC"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M23.5549 34.8516C24.0542 35.4782 24.7874 35.8838 25.5922 35.9785C26.3971 36.0732 27.2072 35.8493 27.8433 35.3562C28.0389 35.2103 28.2149 35.0408 28.3672 34.8516"
      stroke="#8E92BC"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="32" cy="19" r="4" fill={color ?? "#D82823"} />
    <rect x="0.5" y="0.5" width="51" height="51" rx="25.5" stroke="#F5F5F7" />
  </svg>
);
const RedNotification = "Red Icon";
export const RedIcon = ({ color }: { color?: string }) => (
  <svg
    width="8"
    height="9"
    viewBox="0 0 8 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={RedNotification}
  >
    <circle cx="4" cy="4.5" r="4" fill={color ?? "#D82823"} />
  </svg>
);

const durationIconLabel = "Duration icon";
export const DurationIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={durationIconLabel}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M21.2498 12C21.2498 17.109 17.1088 21.25 11.9998 21.25C6.89082 21.25 2.74982 17.109 2.74982 12C2.74982 6.891 6.89082 2.75 11.9998 2.75C17.1088 2.75 21.2498 6.891 21.2498 12Z"
      stroke="#54577A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.4314 14.9417L11.6614 12.6927V7.8457"
      stroke="#54577A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const filterIconLabel = "Filter icon";
export const FilterIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={filterIconLabel}
  >
    <path
      d="M3 7H21"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M6 12H18"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M10 17H14"
      stroke="#8E92BC"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const listIconLabel = "List icon";
export const ListIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={listIconLabel}
  >
    <path
      d="M11.3333 7.08398H28.3333"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M5.66669 7.08398H5.67941"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.66669 17H5.67941"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.66669 26.916H5.67941"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.3333 17H28.3333"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M11.3333 26.916H28.3333"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const cardIconLabel = "Card icon";
export const CardIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={cardIconLabel}
  >
    <path
      d="M3 8.83333C3 6.58686 3 5.46362 3.50565 4.63848C3.78858 4.17677 4.17677 3.78858 4.63848 3.50565C5.46362 3 6.58686 3 8.83333 3C11.0798 3 12.203 3 13.0282 3.50565C13.4899 3.78858 13.8781 4.17677 14.161 4.63848C14.6667 5.46362 14.6667 6.58686 14.6667 8.83333C14.6667 11.0798 14.6667 12.203 14.161 13.0282C13.8781 13.4899 13.4899 13.8781 13.0282 14.161C12.203 14.6667 11.0798 14.6667 8.83333 14.6667C6.58686 14.6667 5.46362 14.6667 4.63848 14.161C4.17677 13.8781 3.78858 13.4899 3.50565 13.0282C3 12.203 3 11.0798 3 8.83333Z"
      stroke="black"
      strokeWidth="1.5"
    />
    <path
      d="M18.6666 8.83333C18.6666 6.58686 18.6666 5.46362 19.1722 4.63848C19.4551 4.17677 19.8434 3.78858 20.3051 3.50565C21.1302 3 22.2535 3 24.5 3C26.7464 3 27.8697 3 28.6949 3.50565C29.1566 3.78858 29.5448 4.17677 29.8277 4.63848C30.3333 5.46362 30.3333 6.58686 30.3333 8.83333C30.3333 11.0798 30.3333 12.203 29.8277 13.0282C29.5448 13.4899 29.1566 13.8781 28.6949 14.161C27.8697 14.6667 26.7464 14.6667 24.5 14.6667C22.2535 14.6667 21.1302 14.6667 20.3051 14.161C19.8434 13.8781 19.4551 13.4899 19.1722 13.0282C18.6666 12.203 18.6666 11.0798 18.6666 8.83333Z"
      stroke="black"
      strokeWidth="1.5"
    />
    <path
      d="M3 24.4993C3 22.2529 3 21.1296 3.50565 20.3045C3.78858 19.8427 4.17677 19.4545 4.63848 19.1716C5.46362 18.666 6.58686 18.666 8.83333 18.666C11.0798 18.666 12.203 18.666 13.0282 19.1716C13.4899 19.4545 13.8781 19.8427 14.161 20.3045C14.6667 21.1296 14.6667 22.2529 14.6667 24.4993C14.6667 26.7458 14.6667 27.8691 14.161 28.6942C13.8781 29.156 13.4899 29.5442 13.0282 29.8271C12.203 30.3327 11.0798 30.3327 8.83333 30.3327C6.58686 30.3327 5.46362 30.3327 4.63848 29.8271C4.17677 29.5442 3.78858 29.156 3.50565 28.6942C3 27.8691 3 26.7458 3 24.4993Z"
      stroke="black"
      strokeWidth="1.5"
    />
    <path
      d="M18.6666 24.4993C18.6666 22.2529 18.6666 21.1296 19.1722 20.3045C19.4551 19.8427 19.8434 19.4545 20.3051 19.1716C21.1302 18.666 22.2535 18.666 24.5 18.666C26.7464 18.666 27.8697 18.666 28.6949 19.1716C29.1566 19.4545 29.5448 19.8427 29.8277 20.3045C30.3333 21.1296 30.3333 22.2529 30.3333 24.4993C30.3333 26.7458 30.3333 27.8691 29.8277 28.6942C29.5448 29.156 29.1566 29.5442 28.6949 29.8271C27.8697 30.3327 26.7464 30.3327 24.5 30.3327C22.2535 30.3327 21.1302 30.3327 20.3051 29.8271C19.8434 29.5442 19.4551 29.156 19.1722 28.6942C18.6666 27.8691 18.6666 26.7458 18.6666 24.4993Z"
      stroke="black"
      strokeWidth="1.5"
    />
  </svg>
);

export const Arrow = ({
  color = "var(--theme-module3-100)",
  direction = "left",
  width = 24,
  height = "auto",
}: {
  color?: string;
  direction?: "up" | "down" | "left" | "right";
  width?: number;
  height?: number | "auto";
}) => {
  const directions: { [key: string]: number } = {
    up: -90,
    down: 90,
    right: 180,
    left: 0,
  };

  const rotation = directions[direction];

  return (
    <svg
      width={width + ""}
      height={height + ""}
      viewBox="0 0 16 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M12.7501 8.5C12.7501 8.5 21.25 14.7601 21.25 17C21.25 19.24 12.75 25.5 12.75 25.5"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const defaultUserIconLabel = "Default user icon";
export const DefaultUserIcon = ({
  height = 100,
  width = 100,
}: {
  height?: number | "auto";
  width?: number | "auto";
}) => (
  <svg
    width={"" + width}
    height={"" + height}
    viewBox="0 0 143 143"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={defaultUserIconLabel}
  >
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.7501 8.5C12.7501 8.5 21.25 14.7601 21.25 17C21.25 19.24 12.75 25.5 12.75 25.5"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </svg>
);

const searchIconLabel = "Search icon";
export const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    color="#000000"
    fill="none"
    aria-label={searchIconLabel}
  >
    <path
      d="M17.5 17.5L22 22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const exportedForTesting = {
  hourglassIconLabel,
  hatIconLabel,
  greenTickLabel,
  purpleStarLabel,
  redCrossLabel,
  bellIconLabel,
  exitIconLabel,
  logOutIconLabel,
  defaultUserIconLabel,

  resourcesIconLabel,
  lectureIconLabel,
  designIconLabel,
  codeIconLabel,
  darkModeIconLabel,
  lightModeIconLabel,
  sidebarIconLabel,
  notificationIconLabel,
  durationIconLabel,
  filterIconLabel,
  listIconLabel,
  cardIconLabel,
  searchIconLabel,
};
