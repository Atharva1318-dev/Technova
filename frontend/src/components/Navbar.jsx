import React, { useRef, useState, useEffect } from "react";
import AboutUsPage from "./AboutUs";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Sparkles,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import LoginButton from "./LoginButton";

// --- GSAP Animation Logic ---
const SHADOW =
  "0 0 24px rgba(34,42,53,.06),0 1px 1px rgba(0,0,0,.05),0 0 0 1px rgba(34,42,53,.04),0 0 4px rgba(34,42,53,.08),0 16px 68px rgba(47,48,55,.05),0 1px 0 rgba(255,255,255,.1) inset";

const navAnimation = (el, visible, extra = {}) =>
  gsap.to(el, {
    backdropFilter: visible ? "blur(10px)" : "none",
    boxShadow: visible ? SHADOW : "none",
    width: visible ? "48%" : "100%",
    y: visible ? 20 : 0,
    duration: 1.1,
    ease: "power2.out",
    ...extra,
  });

// --- Wrapper Components ---

export const NavWrapper = ({ children, className }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`fixed inset-x-0 top-2 z-50 ${className}`}>
      {React.Children.map(children, (c) =>
        React.isValidElement(c) ? React.cloneElement(c, { visible }) : c,
      )}
    </div>
  );
};

export const NavBody = ({ children, visible, className }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      navAnimation(ref.current, visible);
    }
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{ minWidth: "800px" }}
      className={`relative z-50 mx-auto hidden max-w-7xl items-center justify-between rounded-full px-6 py-3 lg:flex backdrop-blur-lg ${
        visible ? "bg-neutral-950/80 dark:bg-neutral-950/80" : ""
      } ${className || ""}`}
    >
      {children}
    </div>
  );
};

export const MobileNav = ({ children, visible }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      navAnimation(ref.current, visible, {
        padding: visible ? "0 12px" : "0",
        borderRadius: visible ? "4px" : "2rem",
        width: "100%",
      });
    }
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`relative z-50 mx-auto flex w-full max-w-[calc(100vw-1rem)] flex-col px-0 py-2 lg:hidden ${
        visible ? "bg-white/80 dark:bg-neutral-950/80" : ""
      }`}
    >
      {children}
    </div>
  );
};

export const NavbarLogo = () => (
  <Link to="/" className="flex items-center gap-1 group cursor-pointer">
    {/* Added securities.png image */}
    <span className="text-2xl font-bold tracking-tight font-sans">
      <span className="text-white">Veri</span>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
        Fi
      </span>
    </span>
    <img
      src="/securities.png"
      alt="VeriFi Logo"
      className="h-10 w-10 object-contain"
    />
  </Link>
);

export const MobileNavToggle = ({ open, onClick }) =>
  open ? (
    <X onClick={onClick} className="cursor-pointer text-white" />
  ) : (
    <Menu onClick={onClick} className="cursor-pointer text-white" />
  );

const NavbarContent = ({ userData, onLogout }) => {
  const logoRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    if (logoRef.current) {
      gsap.from(logoRef.current, { opacity: 0, x: -30, duration: 0.6 });
    }

    if (itemsRef.current.length > 0) {
      gsap.from(itemsRef.current, {
        opacity: 0,
        y: -20,
        stagger: 0.1,
        duration: 0.5,
      });

      itemsRef.current.forEach((el) => {
        if (el) {
          el.onmouseenter = () => gsap.to(el, { y: -5, duration: 0.3 });
          el.onmouseleave = () => gsap.to(el, { y: 0, duration: 0.3 });
        }
      });
    }
  }, []);

  return (
    <div className="flex w-full items-center justify-between shadow-none md:px-2">
      <div ref={logoRef}>
        <NavbarLogo />
      </div>

      {/* Desktop Center Navigation */}
      <div className="absolute left-1/2 hidden -translate-x-1/2 lg:flex gap-2">
        {userData ? (
          <>
            <div ref={(el) => (itemsRef.current[0] = el)}>
              <Link
                to={
                  userData.role === "advisor"
                    ? "/advisor/dashboard"
                    : "/investor/dashboard"
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-md font-light text-white hover:bg-white/10"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <div ref={(el) => (itemsRef.current[1] = el)}>
              <Link
                to={
                  userData.role === "advisor"
                    ? "/advisor/dashboard"
                    : "/investor/dashboard"
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-md font-light text-white hover:bg-white/10"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Signals
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-white/60 text-sm flex items-center gap-4">
            <Link to="/news">Trading News</Link>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <Link to="/about">About Us </Link>
            {/* <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span>SEBI Registered</span> */}
          </div>
        )}
      </div>

      {/* Right Side (Auth) */}
      <div className="flex items-center gap-2">
        {!userData ? (
          <>
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                size="sm"
                className="rounded-full bg-white text-black hover:bg-gray-200"
              >
                Get Started
              </Button>
            </Link>
          </>
        ) : (
          <div className="flex flex-row items-center gap-3">
            <Badge
              variant="secondary"
              className="bg-blue-900/30 text-blue-400 border-blue-800"
            >
              {userData.role === "advisor" ? "ADVISOR" : "INVESTOR"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 border-0"
                >
                  <span className="text-xs font-bold text-white uppercase">
                    {userData.name?.[0] || "U"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl bg-neutral-900 border-neutral-800 text-white mr-4">
                <DropdownMenuItem className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white">
                  <LoginButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const userData = useSelector((state) => state.user.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    window.location.href = "/login";
  };

  return (
    <NavWrapper className="top-4">
      <NavBody>
        <NavbarContent userData={userData} onLogout={handleLogout} />
      </NavBody>

      <MobileNav>
        <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-white/10">
          <NavbarLogo />
          <MobileNavToggle open={open} onClick={() => setOpen(!open)} />
        </div>

        {open && (
          <div className="mt-1 py-4 px-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-neutral-950">
            {!userData ? (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full justify-start bg-blue-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={
                    userData.role === "advisor"
                      ? "/advisor/dashboard"
                      : "/investor/dashboard"
                  }
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white"
                  >
                    Dashboard
                  </Button>
                </Link>
                <LoginButton />
              </>
            )}
          </div>
        )}
      </MobileNav>
    </NavWrapper>
  );
}
