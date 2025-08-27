
// see Tick API in console
console.log(Tick);

// 设置面板相关变量
let tickInstance = null;
let settingsPanel = null;
let currentCounter = null;

// 默认设置
const defaultSettings = {
  size: 6.5,
  horizontalPosition: 50,
  verticalPosition: 50,
  borderColor: '#cccccc',
  backgroundColor: '#f7fff7',
  numberColor: '#ff0004',
  fontWeight: '400',
  backgroundImage: '', // 默认无背景图片，避免文件不存在错误
  targetDateTime: null, // 默认为null，将设置为当前时间+5分钟
  labelFont: null, // 自定义标签字体
  labelFontName: 'CustomLabelFont', // 自定义字体名称
  panelZoom: 1.0, // 设置面板缩放级别，默认1.0（基于6倍基础缩放）
  pageZoom: 1.0 // 页面整体缩放级别，默认1.0（基于0.25倍基础缩放）
};

// 当前设置
let currentSettings = { ...defaultSettings };

// 全屏操作冷却状态
let isFullscreenCoolingDown = false;

// 错误抑制机制，避免重复错误
let lastErrorTime = 0;
let lastErrorMessage = '';

// 清理全屏状态
function cleanupFullscreenState() {
  console.log('🧹 清理全屏状态');
  isFullscreenCoolingDown = false;
  lastErrorTime = 0;
  lastErrorMessage = '';

  // 确保按钮状态正确
  setTimeout(() => {
    updateFullscreenButtonState('normal');
  }, 100);
}

// 页面退出时的清理函数
function cleanupOnExit() {
  console.log('🧹 执行页面退出清理...');

  try {
    // 停止倒计时器
    if (currentCounter) {
      currentCounter.onupdate = null;
      currentCounter.onended = null;
      console.log('⏹️ 倒计时器已停止');
    }

    // 清理全屏状态
    cleanupFullscreenState();

    // 清理任何可能残留的定时器
    // 这里可以添加其他需要清理的资源

    console.log('✅ 页面退出清理完成');
  } catch (error) {
    console.error('❌ 页面退出清理失败:', error);
  }
}

// create visual counter
Tick.DOM.create(document.querySelector('.tick'), {
  credits: false,
  didInit: function (tick) {
    tickInstance = tick;

    // set language
    const locale = {
        YEAR_PLURAL: 'Years',
        YEAR_SINGULAR: 'Year',
        MONTH_PLURAL: 'Months',
        MONTH_SINGULAR: 'Month',
        WEEK_PLURAL: 'Weeks',
        WEEK_SINGULAR: 'Week',
        DAY_PLURAL: '天/Days',
        DAY_SINGULAR: '天/Day',
        HOUR_PLURAL: '时/Hours',
        HOUR_SINGULAR: '时/Hour',
        MINUTE_PLURAL: '分/Minutes',
        MINUTE_SINGULAR: '分/Minute',
        SECOND_PLURAL: '秒/Seconds',
        SECOND_SINGULAR: '秒/Second',
        MILLISECOND_PLURAL: 'Milliseconds',
        MILLISECOND_SINGULAR: 'Millisecond'
    };

    for (const key in locale) {
        if (!locale.hasOwnProperty(key)) { continue; }
        tick.setConstant(key, locale[key]);
    }

    // 初始化目标时间
    if (!currentSettings.targetDateTime) {
      // 默认设置为当前时间+100天
      const defaultTarget = new Date(new Date().getTime() + 120 * 24 * 60 * 60 * 1000);
      currentSettings.targetDateTime = defaultTarget.toISOString();
      console.log('🕐 设置默认目标时间:', currentSettings.targetDateTime);
    } else {
      // 检查现有目标时间是否已过期
      const targetDate = new Date(currentSettings.targetDateTime);
      const now = new Date();
      if (targetDate <= now) {
        console.log('⚠️ 目标时间已过期，重新设置');
        const newTarget = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 明天同一时间
        currentSettings.targetDateTime = newTarget.toISOString();
        console.log('🕐 重新设置目标时间:', currentSettings.targetDateTime);
      }
    }

     // 创建倒计时
     createCountdown();

     // 延迟调整天数显示
     setTimeout(() => {
       adjustDaysDisplay();
     }, 200);

    console.log('initialized');

    // 清理全屏状态
    cleanupFullscreenState();

    // 初始化设置面板
    initializeSettingsPanel();
  },
});

// 创建倒计时函数
function createCountdown() {
  console.log('=== 开始创建倒计时 ===');
  console.log('目标时间:', currentSettings.targetDateTime);

  // 如果已有计数器，先停止它
  if (currentCounter) {
    console.log('停止现有计数器');
    currentCounter.onupdate = null;
    currentCounter.onended = null;
  }

  const targetDate = new Date(currentSettings.targetDateTime);
  console.log('解析后的目标日期:', targetDate);
  console.log('当前时间:', new Date());

  if (isNaN(targetDate.getTime())) {
    console.error('❌ 目标时间无效:', currentSettings.targetDateTime);
    return;
  }

  // 创建新的倒计时
  console.log('创建新的倒计时实例...');
  currentCounter = Tick.count.down(targetDate);
  console.log('倒计时实例创建完成:', currentCounter);

  currentCounter.onupdate = function (value) {
    console.log('⏰ 倒计时更新:', value);

    // 调用分隔符位置调整函数
    adjustSeparatorPosition(value[0]);

    // 直接使用Tick.js标准API更新值
    tickInstance.value = value;
    // 延迟调整天数显示为3位数
    setTimeout(() => {
      adjustDaysDisplay();
    }, 50);
  };

  currentCounter.onended = function () {
    // 倒计时结束时显示全零
    tickInstance.value = {d: 0, h: 0, m: 0, s: 0};
  };

}

// 根据天数动态调整分隔符位置（使用相对单位实现真正的响应式）
function adjustSeparatorPosition(days) {
  // 创建或更新动态分隔符样式
  let separatorStyle = document.getElementById('dynamic-separator-style');
  if (!separatorStyle) {
    separatorStyle = document.createElement('style');
    separatorStyle.id = 'dynamic-separator-style';
    document.head.appendChild(separatorStyle);
  }

  // 使用相对单位确保响应式缩放正常工作
  // 根据天数调整分隔符的右边距，保持与字符宽度成比例
  // 百位数时需要稍微调整位置，因为数字宽度增加了
  const rightPosition = days <= 99 ? '-0.11em' : '-0.1em';
  separatorStyle.textContent = `
    .tick-group:first-child::after {
      left: auto !important;
      right: ${rightPosition} !important;
      transition: none !important;
    }
    .tick-group.has-hundreds::after {
      left: auto !important;
      right: ${rightPosition} !important;
      transition: none !important;
    }
  `;

  console.log(`📏 分隔符位置已调整为: ${rightPosition} (天数: ${days})`);
}

// 调整天数显示为3位数并切换分隔条样式
function adjustDaysDisplay() {
  // 查找天数组（第一个tick-group）
  const dayGroup = document.querySelector('.tick-group:first-child');
  if (!dayGroup) return;

  // 查找天数翻转卡片容器
  const dayValueContainer = dayGroup.querySelector('[data-key="value"]');
  if (!dayValueContainer) return;

  // 获取当前的翻转卡片数量
  const flipCards = dayValueContainer.querySelectorAll('[data-view="flip"]');
  console.log('当前天数翻转卡片数量:', flipCards.length);

  // 如果只有2个翻转卡片，添加第3个（百位）
  if (flipCards.length === 2) {
    console.log('为天数添加第三位（百位）');

    // 创建新的翻转卡片
    const newFlipCard = document.createElement('span');
    newFlipCard.setAttribute('data-view', 'flip');

    // 插入到第一位（百位应该在最前面）
    dayValueContainer.insertBefore(newFlipCard, flipCards[0]);

    // 让Tick.js重新初始化这个新卡片
    if (tickInstance && tickInstance.refresh) {
      tickInstance.refresh();
    }

    // 添加百位数类，切换到使用 ::before 分隔条
    dayGroup.classList.add('has-hundreds');
    console.log('✅ 天数组切换到百位数模式，使用 ::before 分隔条');
  } else if (flipCards.length === 3) {
    // 如果已经有3个翻转卡片，确保使用百位数样式
    dayGroup.classList.add('has-hundreds');
  } else {
    // 如果少于3个翻转卡片，使用默认的 ::after 分隔条
    dayGroup.classList.remove('has-hundreds');
  }
}



// 初始化设置面板
function initializeSettingsPanel() {
  console.log('=== 开始初始化设置面板 ===');
  settingsPanel = document.getElementById('settings-panel');
  console.log('设置面板元素:', settingsPanel);

  // 双击空格键事件监听器
  let spaceKeyCount = 0;
  let spaceKeyTimer = null;

  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      e.preventDefault(); // 防止页面滚动

      spaceKeyCount++;

      // 清除之前的计时器
      if (spaceKeyTimer) {
        clearTimeout(spaceKeyTimer);
      }

      // 设置新的计时器，500ms内如果没有再次按空格，重置计数
      spaceKeyTimer = setTimeout(() => {
        spaceKeyCount = 0;
      }, 500);

      // 如果在500ms内按了两次空格，打开设置面板
      if (spaceKeyCount === 2) {
        showSettingsPanel();
        spaceKeyCount = 0; // 重置计数
        clearTimeout(spaceKeyTimer);
      }
    }
  });

  // 设置控制器事件监听
  setupSettingsControls();

  // 从localStorage加载设置
  loadSettings();

  // 应用当前设置
  applySettings();

  // 应用面板缩放设置
  applyPanelZoom();

  // 应用页面缩放设置
  applyPageZoom();

  // 如果有保存的自定义字体，应用它
  if (currentSettings.labelFont && currentSettings.labelFontName) {
    applyCustomFont(currentSettings.labelFont, currentSettings.labelFontName);
  }

  // 使面板可拖动
  makePanelDraggable();

  // 设置全屏状态监听器
  setupFullscreenListeners();

  // 初始化全屏按钮文本
  updateFullscreenButtonText();

  // 监听页面可见性变化，清理状态
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      console.log('📖 页面重新可见，清理全屏状态');
      cleanupFullscreenState();
    }
  });

  // 监听页面卸载前事件，确保保存设置
  window.addEventListener('beforeunload', function(e) {
    console.log('📤 页面即将卸载，保存设置...');
    // 尝试保存设置
    try {
      saveSettings();
      console.log('✅ 设置已保存');
    } catch (error) {
      console.error('❌ 保存设置失败:', error);
    }

    // 清理定时器和事件监听器
    cleanupOnExit();
  });
}

// 显示设置面板
function showSettingsPanel() {
  settingsPanel.style.display = 'flex';
  updateSettingsUI();
}

// 隐藏设置面板
function hideSettingsPanel() {
  settingsPanel.style.display = 'none';
}

// 设置控制器事件监听
function setupSettingsControls() {
  // 目标时间输入框
  const targetDatetime = document.getElementById('target-datetime');
  if (targetDatetime) {
    // 立即更新倒计时的函数
    const updateCountdownTime = function() {
      const value = targetDatetime.value;
      console.log('🕐 时间选择器更新函数被调用，值:', value);

      if (!value) {
        console.log('⚠️ 时间值为空，跳过更新');
        return;
      }

      const selectedDate = new Date(value);
      const now = new Date();
      console.log('📅 选择的时间:', selectedDate);
      console.log('📅 当前时间:', now);
      console.log('⏰ 时间差:', selectedDate.getTime() - now.getTime(), 'ms');

      if (selectedDate > now) {
        console.log('✅ 时间有效，开始更新倒计时');
        currentSettings.targetDateTime = selectedDate.toISOString();
        console.log('💾 保存目标时间:', currentSettings.targetDateTime);

        // 立即创建倒计时
        createCountdown();

        // 保存设置
        saveSettings();

        // 给用户视觉反馈
        targetDatetime.style.backgroundColor = '#e8f5e8';
        setTimeout(() => {
          targetDatetime.style.backgroundColor = '';
        }, 500);

        console.log('✅ 倒计时更新完成');
      } else {
        console.log('❌ 选择的时间早于当前时间');
        // 给用户错误反馈
        targetDatetime.style.backgroundColor = '#ffe8e8';
        setTimeout(() => {
          targetDatetime.style.backgroundColor = '';
          // 重置为当前设置的值
          targetDatetime.value = formatDateTimeForInput(currentSettings.targetDateTime);
        }, 1000);
      }
    };

    // 监听change事件（用户完成选择时）
    targetDatetime.addEventListener('change', updateCountdownTime);

    // 监听input事件（实时响应，但有防抖）
    let inputTimeout;
    targetDatetime.addEventListener('input', function() {
      console.log('时间选择器输入变化:', this.value);

      // 清除之前的定时器
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }

      // 设置防抖延迟
      inputTimeout = setTimeout(() => {
        updateCountdownTime();
      }, 800); // 800ms后自动更新
    });
  } else {
    console.error('未找到时间选择器元素');
  }

  // 快速测试按钮
  const testButtons = [
    { id: 'test-100-days', days: 100 },
    { id: 'test-200-days', days: 200 },
    { id: 'test-365-days', days: 365 }
  ];

  testButtons.forEach(button => {
    const element = document.getElementById(button.id);
    if (element) {
      element.addEventListener('click', function() {
        console.log(`设置测试时间：${button.days}天后`);

        // 计算目标时间
        const targetDate = new Date(new Date().getTime() + button.days * 24 * 60 * 60 * 1000);
        currentSettings.targetDateTime = targetDate.toISOString();

        // 更新UI
        document.getElementById('target-datetime').value = formatDateTimeForInput(currentSettings.targetDateTime);

        // 重新创建倒计时
        createCountdown();

        // 保存设置
        saveSettings();

        // 视觉反馈
        this.style.backgroundColor = '#e8f5e8';
        setTimeout(() => {
          this.style.backgroundColor = '';
        }, 500);

        console.log(`✅ 已设置${button.days}天后的倒计时`);
      });
    }
  });

  // 大小滑块
  const sizeSlider = document.getElementById('size-slider');
  const sizeValue = document.getElementById('size-value');
  sizeSlider.addEventListener('input', function() {
    currentSettings.size = parseFloat(this.value);
    sizeValue.textContent = `${this.value} rem`;
    applySettings();
  });

  // 水平位置滑块
  const horizontalSlider = document.getElementById('horizontal-slider');
  const horizontalValue = document.getElementById('horizontal-value');
  horizontalSlider.addEventListener('input', function() {
    currentSettings.horizontalPosition = parseInt(this.value);
    horizontalValue.textContent = `${this.value}%`;
    applySettings();
  });

  // 垂直位置滑块
  const verticalSlider = document.getElementById('vertical-slider');
  const verticalValue = document.getElementById('vertical-value');
  verticalSlider.addEventListener('input', function() {
    currentSettings.verticalPosition = parseInt(this.value);
    verticalValue.textContent = `${this.value}%`;
    applySettings();
  });

  // 边框颜色
  const borderColor = document.getElementById('border-color');
  borderColor.addEventListener('input', function() {
    currentSettings.borderColor = this.value;
    applySettings();
  });

  // 背景颜色
  const backgroundColor = document.getElementById('background-color');
  backgroundColor.addEventListener('input', function() {
    currentSettings.backgroundColor = this.value;
    applySettings();
  });

  // 数字颜色
  const numberColor = document.getElementById('number-color');
  numberColor.addEventListener('input', function() {
    currentSettings.numberColor = this.value;
    applySettings();
  });

  // 字体粗细
  const fontWeight = document.getElementById('font-weight');
  fontWeight.addEventListener('change', function() {
    currentSettings.fontWeight = this.value;
    applySettings();
  });

  // 背景图片
  const backgroundImage = document.getElementById('background-image');
  backgroundImage.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      console.log('📸 选择的背景图片文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择有效的图片文件！');
        return;
      }

      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('图片文件过大，请选择小于10MB的图片！');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        currentSettings.backgroundImage = e.target.result;
        applySettings();

        // 保存设置
        saveSettings();

        // 给用户视觉反馈
        const label = document.querySelector('label[for="background-image"]');
        const originalText = label.textContent;
        label.textContent = '背景已应用';
        label.style.color = '#28a745';

        setTimeout(() => {
          label.textContent = originalText;
          label.style.color = '';
        }, 2000);

        console.log('✅ 背景图片已成功应用');
      };

      reader.onerror = function() {
        console.error('背景图片读取失败');
        alert('图片文件读取失败，请重试');
      };

      reader.readAsDataURL(file);
    }
  });

  // 移除背景按钮
  const removeBg = document.getElementById('remove-bg');
  removeBg.addEventListener('click', function() {
    currentSettings.backgroundImage = '';
    applySettings();

    // 保存设置
    saveSettings();

    // 给用户视觉反馈
    this.style.backgroundColor = '#e8f5e8';
    setTimeout(() => {
      this.style.backgroundColor = '';
    }, 500);

    console.log('🗑️ 背景图片已移除');
  });

  // 标签字体选择
  const labelFont = document.getElementById('label-font');
  labelFont.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      console.log('选择的字体文件:', file.name);

      // 检查文件类型
      const validTypes = ['.ttf', '.otf', '.woff', '.woff2'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        alert('请选择有效的字体文件格式 (.ttf, .otf, .woff, .woff2)');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const fontData = e.target.result;
        const fontName = 'CustomLabelFont_' + Date.now(); // 生成唯一字体名

        // 保存字体数据和名称
        currentSettings.labelFont = fontData;
        currentSettings.labelFontName = fontName;

        console.log('字体文件读取完成，字体名称:', fontName);

        // 应用字体
        applyCustomFont(fontData, fontName);

        // 保存设置
        saveSettings();

        // 给用户反馈
        const label = document.querySelector('label[for="label-font"]');
        const originalText = label.textContent;
        label.textContent = '字体已应用';
        label.style.color = '#28a745';

        setTimeout(() => {
          label.textContent = originalText;
          label.style.color = '';
        }, 2000);
      };

      reader.onerror = function() {
        console.error('字体文件读取失败');
        alert('字体文件读取失败，请重试');
      };

      reader.readAsDataURL(file);
    }
  });

  // 重置字体按钮
  const resetFont = document.getElementById('reset-font');
  resetFont.addEventListener('click', function() {
    currentSettings.labelFont = null;
    currentSettings.labelFontName = null;

    // 移除自定义字体样式
    removeCustomFont();

    // 保存设置
    saveSettings();

    // 给用户反馈
    this.style.backgroundColor = '#e8f5e8';
    setTimeout(() => {
      this.style.backgroundColor = '';
    }, 500);

    console.log('已重置标签字体为默认字体');
  });

    // 重置面板缩放按钮
  const resetZoomButton = document.getElementById('reset-zoom');
  if (resetZoomButton) {
    resetZoomButton.addEventListener('click', function() {
      currentSettings.panelZoom = 1.0;
      applyPanelZoom();
      updateZoomDisplay();
      saveSettings();

      // 视觉反馈
      this.style.backgroundColor = '#e8f5e8';
      setTimeout(() => {
        this.style.backgroundColor = '';
      }, 500);

      console.log('🔄 面板缩放已重置为100%');
    });
  }

  // 重置页面缩放按钮
  const resetPageZoomButton = document.getElementById('reset-page-zoom');
  if (resetPageZoomButton) {
    resetPageZoomButton.addEventListener('click', function() {
      currentSettings.pageZoom = 1.0;
      applyPageZoom();
      updatePageZoomDisplay();
      saveSettings();

      // 视觉反馈
      this.style.backgroundColor = '#e8f5e8';
      setTimeout(() => {
        this.style.backgroundColor = '';
      }, 500);

      console.log('🔄 倒计时缩放已重置为100%');
    });
  }

  // 全屏切换按钮
  console.log('=== 查找全屏按钮 ===');
  const fullscreenButton = document.getElementById('toggle-fullscreen');
  console.log('全屏按钮元素:', fullscreenButton);

  if (fullscreenButton) {
    console.log('✅ 全屏按钮找到，正在绑定事件监听器');

    // 使用防抖的全屏操作
    fullscreenButton.onclick = function(e) {
      console.log('🖱️ 全屏按钮被点击！');
      e.preventDefault();
      e.stopPropagation();

      // 调用带防抖的全屏切换函数
      toggleFullScreenWithDebounce();
    };

    console.log('✅ 全屏按钮事件监听器绑定完成');
  } else {
    console.error('❌ 未找到全屏按钮元素 (id: toggle-fullscreen)');
    console.log('尝试查找所有按钮:', document.querySelectorAll('button'));
  }

  // 重置按钮
  const resetButton = document.getElementById('reset-settings');
  resetButton.addEventListener('click', function() {
    currentSettings = { ...defaultSettings };
    updateSettingsUI();
    applySettings();
  });

  // 关闭按钮
  const closeButton = document.getElementById('close-settings');
  closeButton.addEventListener('click', function() {
    saveSettings();
    hideSettingsPanel();
  });

  // 点击面板背景关闭设置面板
  settingsPanel.addEventListener('click', function(e) {
    // 只有当点击的是面板背景（settings-panel），而不是内容区域（settings-content）时才关闭
    if (e.target === settingsPanel) {
      console.log('🖱️ 点击面板外部，关闭设置面板');
      saveSettings();
      hideSettingsPanel();
    }
  });

  // 阻止内容区域的点击事件冒泡，防止误关闭
  const settingsContent = settingsPanel.querySelector('.settings-content');
  if (settingsContent) {
    settingsContent.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  // ESC键关闭设置面板
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && settingsPanel.style.display === 'flex') {
      console.log('⌨️ 按下ESC键，关闭设置面板');
      saveSettings();
      hideSettingsPanel();
    }
  });

  // 添加设置面板的Ctrl+滚轮缩放功能
  setupPanelZoomControls();

  // 添加页面整体的Ctrl+滚轮缩放功能
  setupPageZoomControls();
}

// 格式化日期时间为输入框格式
function formatDateTimeForInput(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 更新设置界面
function updateSettingsUI() {
  // 更新目标时间输入框
  if (currentSettings.targetDateTime) {
    document.getElementById('target-datetime').value = formatDateTimeForInput(currentSettings.targetDateTime);
  }

  document.getElementById('size-slider').value = currentSettings.size;
  document.getElementById('size-value').textContent = `${currentSettings.size} rem`;

  document.getElementById('horizontal-slider').value = currentSettings.horizontalPosition;
  document.getElementById('horizontal-value').textContent = `${currentSettings.horizontalPosition}%`;

  document.getElementById('vertical-slider').value = currentSettings.verticalPosition;
  document.getElementById('vertical-value').textContent = `${currentSettings.verticalPosition}%`;

  document.getElementById('border-color').value = currentSettings.borderColor;
  document.getElementById('background-color').value = currentSettings.backgroundColor;
  document.getElementById('number-color').value = currentSettings.numberColor;
  document.getElementById('font-weight').value = currentSettings.fontWeight;

  // 更新缩放显示
  updateZoomDisplay();
  updatePageZoomDisplay();
}

// 应用设置
function applySettings() {
  const tickElement = document.querySelector('.tick');
  const body = document.body;

  // 应用大小 - 使用CSS自定义属性来调整响应式基础大小
  // 通过缩放系数来微调响应式字体大小，而不是覆盖响应式设计
  const scaleFactor = currentSettings.size / 4; // 4是默认值
  tickElement.style.setProperty('--scale-factor', scaleFactor);

  // 使用transform scale来调整大小，保持响应式特性
  const baseTransform = 'translate(-50%, -50%)';
  tickElement.style.transform = `${baseTransform} scale(${scaleFactor})`;

  // 应用位置
  tickElement.style.left = `${currentSettings.horizontalPosition}%`;
  tickElement.style.top = `${currentSettings.verticalPosition}%`;

  // 创建或更新动态样式
  let dynamicStyle = document.getElementById('dynamic-styles');
  if (!dynamicStyle) {
    dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'dynamic-styles';
    document.head.appendChild(dynamicStyle);
  }

  dynamicStyle.textContent = `
    .tick-flip {
      font-weight: ${currentSettings.fontWeight} !important;
    }
    .tick-flip-panel {
      background-color: ${currentSettings.backgroundColor} !important;
      color: ${currentSettings.numberColor} !important;
    }
    .tick-flip-card {
      border: 2px solid ${currentSettings.borderColor} !important;
    }
    .tick-counter-container {
      border: 5px solid ${currentSettings.borderColor} !important;
    }
  `;

  // 应用背景图片（添加错误处理）
  if (currentSettings.backgroundImage) {
    try {
      // 设置自定义背景图片，铺满全屏且保持比例，不变形
      body.style.backgroundImage = `url("${currentSettings.backgroundImage}")`;
      body.style.backgroundSize = 'cover'; // 覆盖整个容器，保持比例
      body.style.backgroundPosition = 'center center'; // 居中显示
      body.style.backgroundRepeat = 'no-repeat'; // 不重复
      body.style.backgroundAttachment = 'fixed'; // 固定背景，不随滚动移动

      console.log('✅ 自定义背景图片已应用');
    } catch (error) {
      console.warn('背景图片设置失败:', error);
      // 恢复默认背景
      resetToDefaultBackground();
    }
  } else {
    // 恢复默认背景（Logo和按钮）
    resetToDefaultBackground();
  }
}

// 恢复默认背景设置
function resetToDefaultBackground() {
  const body = document.body;

  // 清除所有背景设置，恢复为默认状态
  body.style.backgroundImage = '';
  body.style.backgroundSize = '';
  body.style.backgroundPosition = '';
  body.style.backgroundRepeat = '';
  body.style.backgroundAttachment = '';

  console.log('🔄 已恢复默认背景设置');
}

// 保存设置到localStorage
function saveSettings() {
  localStorage.setItem('flipCounterSettings', JSON.stringify(currentSettings));
}

// 从localStorage加载设置
function loadSettings() {
  try {
    const saved = localStorage.getItem('flipCounterSettings');
    if (saved) {
      const parsedSettings = JSON.parse(saved);

      // 验证加载的设置，只保留有效字段
      const validSettings = {};
      for (const key in defaultSettings) {
        if (parsedSettings.hasOwnProperty(key)) {
          validSettings[key] = parsedSettings[key];
        }
      }

      currentSettings = { ...defaultSettings, ...validSettings };
      console.log('✅ 设置加载成功');
    } else {
      currentSettings = { ...defaultSettings };
      console.log('📋 使用默认设置');
    }
  } catch (e) {
    console.error('❌ 设置加载失败:', e);
    currentSettings = { ...defaultSettings };

    // 清除损坏的设置
    try {
      localStorage.removeItem('flipCounterSettings');
    } catch (cleanupError) {
      console.error('清理设置失败:', cleanupError);
    }
  }
}

// 使面板可拖动
function makePanelDraggable() {
  const panel = document.getElementById('settings-panel');
  const content = panel.querySelector('.settings-content');
  const header = document.getElementById('settings-header');
  let isDragging = false;
  let offsetX, offsetY;

  const onMouseMove = (e) => {
    if (!isDragging) return;
    content.style.left = `${e.clientX - offsetX}px`;
    content.style.top = `${e.clientY - offsetY}px`;
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = content.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // 切换到绝对定位以进行拖动
    panel.style.justifyContent = 'flex-start';
    panel.style.alignItems = 'flex-start';
    content.style.position = 'absolute';
    content.style.left = `${rect.left}px`;
    content.style.top = `${rect.top}px`;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    e.preventDefault();
  });
}

// 检测当前全屏状态的统一函数
function isCurrentlyFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

// 更新全屏按钮文本
function updateFullscreenButtonText() {
  const fullscreenButton = document.getElementById('toggle-fullscreen');
  if (fullscreenButton) {
    // 如果不在冷却中，才更新文本
    if (!isFullscreenCoolingDown) {
      const isFullscreen = isCurrentlyFullscreen();
      const newText = isFullscreen ? '退出全屏' : '进入全屏';

      // 只在文本实际变化时更新和输出日志
      if (fullscreenButton.textContent !== newText) {
        fullscreenButton.textContent = newText;
        console.log('🔄 按钮文本更新为:', newText);
      }
    }
  }
}

// 显示全屏提示消息
function showFullscreenTip(message, type = 'info') {
  // 移除现有的提示
  const existingTip = document.getElementById('fullscreen-tip');
  if (existingTip) {
    existingTip.remove();
  }

  // 创建新的提示元素
  const tip = document.createElement('div');
  tip.id = 'fullscreen-tip';
  tip.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4488ff'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;

  // 添加动画样式
  if (!document.getElementById('fullscreen-tip-styles')) {
    const style = document.createElement('style');
    style.id = 'fullscreen-tip-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  tip.innerHTML = message;
  document.body.appendChild(tip);

  // 3秒后自动移除
  setTimeout(() => {
    if (tip.parentNode) {
      tip.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (tip.parentNode) {
          tip.remove();
        }
      }, 300);
    }
  }, 3000);
}

// 检查全屏权限和支持情况
function checkFullscreenSupport() {
  const docEl = document.documentElement;
  const hasFullscreenAPI = !!(
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen
  );

  return {
    supported: hasFullscreenAPI,
    userActivationRequired: true // 现代浏览器都需要用户激活
  };
}

// 带防抖的全屏切换函数
function toggleFullScreenWithDebounce() {
  console.log('🚀 ===== Fullscreen button clicked =====');
  console.log('🔍 当前冷却状态:', isFullscreenCoolingDown);
  console.log('🔍 当前全屏状态:', isCurrentlyFullscreen());

  if (isFullscreenCoolingDown) {
    console.log('⏳ 全屏操作冷却中，忽略此次点击');
    showFullscreenTip('操作过于频繁，请稍候...', 'info');
    return;
  }

  // 开启冷却状态
  isFullscreenCoolingDown = true;
  updateFullscreenButtonState('processing');
  console.log('🔄 开启冷却状态');

  // 执行全屏切换
  toggleFullScreen();

  // 🔧 正常的冷却重置机制 - 1.2秒后自动重置
  setTimeout(() => {
    if (isFullscreenCoolingDown) {
      console.log('✅ 正常重置：冷却时间到，重置状态');
      isFullscreenCoolingDown = false;
      updateFullscreenButtonState('normal');
    }
  }, 1200); // 1.2秒正常重置

  // 🔧 兜底安全机制 - 如果1.5秒后状态还没被重置，强制重置
  setTimeout(() => {
    if (isFullscreenCoolingDown) {
      console.log('⚠️ 兜底重置：冷却状态超时，强制重置');
      isFullscreenCoolingDown = false;
      updateFullscreenButtonState('normal');
    }
  }, 1500); // 1.5秒兜底重置
}

// 更新全屏按钮状态
function updateFullscreenButtonState(state) {
  const fullscreenButton = document.getElementById('toggle-fullscreen');
  if (!fullscreenButton) return;

  if (state === 'processing') {
    fullscreenButton.textContent = '处理中...';
    fullscreenButton.style.opacity = '0.7';
    fullscreenButton.disabled = true;
  } else { // 'normal'
    fullscreenButton.style.opacity = '1';
    fullscreenButton.disabled = false;
    updateFullscreenButtonText();
  }
}

// 原始的全屏切换逻辑
function toggleFullScreen() {
  console.log('🚀 ===== toggleFullScreen 被调用 =====');

  // 检查浏览器支持情况
  const support = checkFullscreenSupport();
  if (!support.supported) {
    console.error('❌ 浏览器不支持全屏API');
    handleFullscreenError(new Error('浏览器不支持全屏API')); // 使用统一错误处理
    return;
  }

  // 使用统一的状态检测函数
  const isFullscreen = isCurrentlyFullscreen();
  console.log('当前全屏状态:', isFullscreen);

  if (!isFullscreen) {
    // 进入全屏模式
    enterFullscreen();
  } else {
    // 退出全屏模式
    exitFullscreen();
  }
}

// 进入全屏模式
function enterFullscreen() {
  const docEl = document.documentElement;
  console.log('📱 准备进入全屏模式');

  // 按优先级获取全屏API
  const requestFullscreen =
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen;

  if (!requestFullscreen) {
    console.error('❌ 找不到可用的全屏API');
    finishFullscreenOperation(false, '浏览器不支持全屏API<br>💡 请尝试按 <strong>F11</strong> 键进入全屏');
    return;
  }

  console.log('✅ 找到可用的全屏API，尝试进入全屏模式...');

  try {
    const result = requestFullscreen.call(docEl);

    // 统一处理Promise和非Promise的返回值
    if (result && typeof result.then === 'function') {
      // 现代浏览器返回Promise
      result
        .then(() => {
          console.log('✅ 成功进入全屏模式');
          showFullscreenTip('✅ 已进入全屏模式', 'success');
        })
        .catch(err => {
          console.error('❌ 进入全屏失败:', err);
          handleFullscreenError(err);
        });
    } else {
      // 老版本浏览器，延迟后检查状态
      setTimeout(() => {
        if (isCurrentlyFullscreen()) {
          console.log('✅ 成功进入全屏模式（非Promise API）');
          showFullscreenTip('✅ 已进入全屏模式', 'success');
        } else {
          console.log('❌ 进入全屏失败（非Promise API）');
          handleFullscreenError(new Error('全屏请求被拒绝或失败'));
        }
      }, 150);
    }
  } catch (error) {
    console.error('❌ 全屏API调用异常:', error);
    handleFullscreenError(error);
  }
}

// 退出全屏模式
function exitFullscreen() {
  console.log('📱 准备退出全屏模式');

  const exitFullscreenAPI =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;

  if (!exitFullscreenAPI) {
    console.error('❌ 浏览器不支持退出全屏API');
    finishFullscreenOperation(false, '浏览器不支持退出全屏<br>💡 请按 <strong>ESC</strong> 键退出');
    return;
  }

  try {
    const result = exitFullscreenAPI.call(document);

    if (result && typeof result.then === 'function') {
      // 现代浏览器返回Promise
      result
        .then(() => {
          console.log('✅ 成功退出全屏模式');
          showFullscreenTip('已退出全屏模式', 'info');
        })
        .catch(err => {
          console.error('❌ 退出全屏失败:', err);
          handleFullscreenError(err); // 使用统一的错误处理函数
        });
    } else {
      // 老版本浏览器，简单延迟后显示消息
      setTimeout(() => {
        console.log('✅ 退出全屏操作完成（非Promise API）');
        showFullscreenTip('已退出全屏模式', 'info');
      }, 100);
    }
  } catch (error) {
    console.error('❌ 退出全屏API调用异常:', error);
    handleFullscreenError(error); // 使用统一的错误处理函数
  }
}

// 完成全屏操作的统一处理函数
function finishFullscreenOperation(success, message) {
  // 🔧 修复：重置处理状态
  console.log('🔄 操作完成：重置冷却状态, 成功:', success);
  isFullscreenCoolingDown = false;

  if (success) {
    updateFullscreenButtonState('normal');
    showFullscreenTip(message, 'success');
  } else {
    updateFullscreenButtonState('normal'); // 即使失败也要恢复正常状态
    showFullscreenTip(message, 'error');
  }

  // 延迟更新按钮文本，确保状态正确
  setTimeout(() => {
    updateFullscreenButtonText();
  }, 100);
}

// 处理全屏错误
function handleFullscreenError(error) {
  console.error('全屏操作失败:', error);

  // 🔧 修复：错误时必须重置冷却状态，否则按钮会永久卡死
  console.log('🔄 错误处理：重置冷却状态');
  isFullscreenCoolingDown = false;
  updateFullscreenButtonState('normal');

  let message = '进入全屏失败，请稍后重试。';

  // 更全面的错误类型检查
  if (error && typeof error === 'object') {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = '全屏请求被浏览器拒绝。<br>💡 请避免快速连续点击，稍后重试。';
    } else if (error.name === 'TypeError' && (error.message.includes('not granted') || error.message.includes('not allowed'))) {
      message = '全屏权限不可用。<br>💡 请尝试按 <strong>F11</strong> 键进入全屏。';
    } else if (error.message && error.message.includes('浏览器不支持')) {
      message = '您的浏览器不支持全屏功能<br>💡 请尝试按 <strong>F11</strong> 键进入全屏';
    } else if (error.name === 'AbortError') {
      message = '全屏操作被中断，请重试。';
    }
  } else if (typeof error === 'string' && error.includes('浏览器不支持')) {
    message = '您的浏览器不支持全屏功能<br>💡 请尝试按 <strong>F11</strong> 键进入全屏';
  }

  // 🔧 错误抑制：避免重复显示相同错误
  const now = Date.now();
  if (now - lastErrorTime < 3000 && lastErrorMessage === message) {
    console.log('🔇 抑制重复错误提示');
    return;
  }

  lastErrorTime = now;
  lastErrorMessage = message;
  showFullscreenTip(message, 'error');
}

// 监听全屏状态变化
function setupFullscreenListeners() {
  // 监听各种全屏状态变化事件
  const events = ['fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'];

  events.forEach(event => {
    document.addEventListener(event, () => {
      console.log('🔄 全屏状态发生变化，当前冷却状态:', isFullscreenCoolingDown);

      // 🔧 修复：状态变化时重置冷却状态，确保同步
      if (isFullscreenCoolingDown) {
        console.log('🔄 状态变化：重置冷却状态');
        isFullscreenCoolingDown = false;
        updateFullscreenButtonState('normal');
      } else {
        // 只是更新按钮文本
        updateFullscreenButtonText();
      }
    });
  });
}

// 应用自定义字体到标签
function applyCustomFont(fontData, fontName) {
  console.log('开始应用自定义字体:', fontName);

  // 移除之前的自定义字体样式
  removeCustomFont();

  // 创建字体样式
  const fontStyle = document.createElement('style');
  fontStyle.id = 'custom-label-font';

  // 根据字体数据格式确定字体格式
  let fontFormat = 'truetype'; // 默认
  if (fontData.includes('data:font/woff2')) {
    fontFormat = 'woff2';
  } else if (fontData.includes('data:font/woff')) {
    fontFormat = 'woff';
  } else if (fontData.includes('data:font/opentype') || fontData.includes('.otf')) {
    fontFormat = 'opentype';
  }

  fontStyle.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('${fontData}') format('${fontFormat}');
      font-display: swap;
    }

    .tick-label {
      font-family: '${fontName}', 'DouyuFont', 'TyfoonSans', sans-serif !important;
    }
  `;

  document.head.appendChild(fontStyle);
  console.log('✅ 自定义字体样式已应用');
}

// 移除自定义字体
function removeCustomFont() {
  const existingStyle = document.getElementById('custom-label-font');
  if (existingStyle) {
    existingStyle.remove();
    console.log('已移除自定义字体样式');
  }
}

// 应用设置面板缩放
function applyPanelZoom() {
  if (!settingsPanel) return;

  // 基础缩放是6倍（为了补偿body的0.25倍缩放）
  // 用户缩放是在基础缩放基础上的额外缩放
  const baseScale = 6;
  const finalScale = baseScale * currentSettings.panelZoom;

  settingsPanel.style.transform = `scale(${finalScale})`;

  // 更新显示
  updateZoomDisplay();

  console.log(`🔍 应用面板缩放: 基础${baseScale}x × 用户${currentSettings.panelZoom}x = ${finalScale}x`);
}

// 更新面板缩放显示
function updateZoomDisplay() {
  const zoomLevelElement = document.getElementById('zoom-level');
  if (zoomLevelElement) {
    const percentage = Math.round(currentSettings.panelZoom * 100);
    zoomLevelElement.textContent = `${percentage}%`;
  }
}

// 更新页面缩放显示
function updatePageZoomDisplay() {
  const pageZoomLevelElement = document.getElementById('page-zoom-level');
  if (pageZoomLevelElement) {
    const percentage = Math.round(currentSettings.pageZoom * 100);
    pageZoomLevelElement.textContent = `${percentage}%`;
  }
}

// 设置面板缩放控制
function setupPanelZoomControls() {
  if (!settingsPanel) return;

  // 监听设置面板上的滚轮事件
  settingsPanel.addEventListener('wheel', function(e) {
    // 只有在按住Ctrl键时才触发缩放
    if (!e.ctrlKey) return;

    // 阻止默认的页面缩放行为
    e.preventDefault();
    e.stopPropagation();

    // 计算缩放变化量
    // deltaY > 0 表示向下滚动（缩小），deltaY < 0 表示向上滚动（放大）
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.3, Math.min(3.0, currentSettings.panelZoom + zoomDelta));

        // 只有缩放值确实发生变化时才更新
    if (Math.abs(newZoom - currentSettings.panelZoom) > 0.05) {
      const oldZoom = currentSettings.panelZoom;
      currentSettings.panelZoom = newZoom;
      applyPanelZoom();

      // 保存设置
      saveSettings();

      // 显示缩放提示
      showZoomTip(newZoom, oldZoom);

      console.log(`🎯 面板缩放调整为: ${(newZoom * 100).toFixed(0)}%`);
    }
  }, { passive: false });

  console.log('✅ 设置面板缩放控制已初始化（Ctrl+滚轮）');
}

// 显示缩放提示
function showZoomTip(newZoom, oldZoom) {
  // 移除现有的缩放提示
  const existingTip = document.getElementById('zoom-tip');
  if (existingTip) {
    existingTip.remove();
  }

  // 判断缩放方向
  const direction = newZoom > oldZoom ? '🔍+' : '🔍-';
  const percentage = Math.round(newZoom * 100);

  // 创建新的提示元素
  const tip = document.createElement('div');
  tip.id = 'zoom-tip';
  tip.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10001;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: none;
    transition: opacity 0.2s ease;
  `;

  tip.innerHTML = `${direction} 面板缩放: ${percentage}%`;
  document.body.appendChild(tip);

  // 1秒后自动移除
  setTimeout(() => {
    if (tip.parentNode) {
      tip.style.opacity = '0';
      setTimeout(() => {
        if (tip.parentNode) {
          tip.remove();
        }
      }, 200);
    }
  }, 1000);
}

// 应用页面整体缩放（作用于倒计时容器）
function applyPageZoom() {
  const counterContainer = document.querySelector('.tick-counter-container');

  if (!counterContainer) {
    console.warn('❌ 未找到倒计时容器元素');
    return;
  }

  // 直接使用用户设置的缩放比例，不需要基础缩放
  const finalScale = currentSettings.pageZoom;

  // 获取现有的transform属性，保留其他变换
  const currentTransform = counterContainer.style.transform || '';

  // 移除现有的scale变换，保留其他变换
  const transformWithoutScale = currentTransform.replace(/scale\([^)]*\)/g, '').trim();

  // 应用新的缩放
  const newTransform = transformWithoutScale
    ? `${transformWithoutScale} scale(${finalScale})`
    : `scale(${finalScale})`;

  counterContainer.style.transform = newTransform;

  // 更新显示
  updatePageZoomDisplay();

  console.log(`🔍 应用倒计时容器缩放: ${(currentSettings.pageZoom * 100).toFixed(0)}%`);
}

// 页面整体缩放控制
function setupPageZoomControls() {
  // 监听整个文档的滚轮事件
  document.addEventListener('wheel', function(e) {
    // 只有在按住Ctrl键时才触发缩放
    if (!e.ctrlKey) return;

    // 如果事件发生在设置面板内，不处理（让设置面板的缩放优先）
    if (settingsPanel && settingsPanel.style.display === 'flex' &&
        settingsPanel.contains(e.target)) {
      return;
    }

    // 阻止默认的页面缩放行为
    e.preventDefault();
    e.stopPropagation();

    // 计算缩放变化量
    // deltaY > 0 表示向下滚动（缩小），deltaY < 0 表示向上滚动（放大）
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.3, Math.min(3.0, currentSettings.pageZoom + zoomDelta));

    // 只有缩放值确实发生变化时才更新
    if (Math.abs(newZoom - currentSettings.pageZoom) > 0.05) {
      const oldZoom = currentSettings.pageZoom;
      currentSettings.pageZoom = newZoom;
      applyPageZoom();

      // 保存设置
      saveSettings();

      // 显示缩放提示
      showPageZoomTip(newZoom, oldZoom);

      console.log(`🎯 倒计时容器缩放调整为: ${(newZoom * 100).toFixed(0)}%`);
    }
  }, { passive: false });

  console.log('✅ 页面整体缩放控制已初始化（Ctrl+滚轮）');
}

// 显示页面缩放提示
function showPageZoomTip(newZoom, oldZoom) {
  // 移除现有的页面缩放提示
  const existingTip = document.getElementById('page-zoom-tip');
  if (existingTip) {
    existingTip.remove();
  }

  // 判断缩放方向
  const direction = newZoom > oldZoom ? '🔍+' : '🔍-';
  const percentage = Math.round(newZoom * 100);

  // 创建新的提示元素
  const tip = document.createElement('div');
  tip.id = 'page-zoom-tip';
  tip.style.cssText = `
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(34, 139, 34, 0.9);
    color: white;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10002;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: none;
    transition: opacity 0.2s ease;
  `;

  tip.innerHTML = `${direction} 倒计时缩放: ${percentage}%`;
  document.body.appendChild(tip);

  // 1秒后自动移除
  setTimeout(() => {
    if (tip.parentNode) {
      tip.style.opacity = '0';
      setTimeout(() => {
        if (tip.parentNode) {
          tip.remove();
        }
      }, 200);
    }
  }, 1000);
}
