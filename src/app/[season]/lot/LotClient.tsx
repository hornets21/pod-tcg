"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../../hooks/useGacha";
import { CustomDialog, DialogButton } from "../../../components/Modals";
import { useModal } from "../../../components/ModalContext";
import { LotSeason1 } from "./components/LotSeason1";
import { LotSeason2 } from "./components/LotSeason2";
import { ThreeScene } from "../../../components/three/ThreeScene";

export default function LotClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";

  const {
    cards,
    isLoaded,
    lotSelection,
    toggleLotCard,
    clearLotSelection,
    activeLot,
    startLot,
    revealLotCard,
    confirmResetLot,
  } = useGacha(season);

  const { setSelectedDetailCard } = useModal();



  // Custom Confirmation Dialog states
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    icon: string;
    title: string;
    message: string;
    buttons: DialogButton[];
  }>({
    isOpen: false,
    icon: "",
    title: "",
    message: "",
    buttons: [],
  });

  const handleStartLot = () => {
    if (lotSelection.length === 0 || lotSelection.length > 10) {
      setCustomDialog({
        isOpen: true,
        icon: "⚠️",
        title: "คำเตือน",
        message: "กรุณาเลือกการ์ดอย่างน้อย 1 ใบ (สูงสุด 10 ใบ)",
        buttons: [
          {
            text: "ตกลง",
            onClick: () => setCustomDialog((prev) => ({ ...prev, isOpen: false })),
          },
        ],
      });
      return;
    }

    startLot();
  };

  const handleResetConfirm = () => {
    setCustomDialog({
      isOpen: true,
      icon: "❓",
      title: "ยืนยันการตั้งค่าใหม่",
      message: "คุณต้องการจบล็อตนี้และกลับไปหน้าเดิมใช่หรือไม่? (ความคืบหน้าจะหายไป และรายการที่เลือกจะถูกล้าง)",
      buttons: [
        {
          text: "ยกเลิก",
          onClick: () => setCustomDialog((prev) => ({ ...prev, isOpen: false })),
          className: "btn-secondary logout-btn-cancel",
        },
        {
          text: "ยืนยัน",
          onClick: () => {
            confirmResetLot();
            setCustomDialog((prev) => ({ ...prev, isOpen: false }));
          },
          className: "btn-danger logout-btn-confirm",
        },
      ],
    });
  };

  if (!isLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "white",
          fontFamily: "var(--font-kanit)",
          fontSize: "1.2rem",
        }}
      >
        กำลังโหลดหน้าจัดการล็อต...
      </div>
    );
  }

  const commonProps = {
    cards,
    lotSelection,
    toggleLotCard,
    clearLotSelection,
    activeLot,
    startLot,
    revealLotCard,
    handleResetConfirm,
    setSelectedDetailCard,
    handleStartLot,
  };

  return (
    <div className="main-wrapper">

      <ThreeScene cameraPosition={[0, 0, 7]} fogColor="#07060a" showDefaultLighting={false} showAtmosphere={true}>
        {null}
      </ThreeScene>

      <main>
        {season === "season2" ? (
          <LotSeason2 {...commonProps} />
        ) : (
          <LotSeason1 {...commonProps} />
        )}

        <CustomDialog
          isOpen={customDialog.isOpen}
          icon={customDialog.icon}
          title={customDialog.title}
          message={customDialog.message}
          buttons={customDialog.buttons}
          onClose={() => setCustomDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      </main>

      <style jsx>{`
        .main-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
        }
      `}</style>
    </div>
  );
}
